export interface DeudorSEPA {
  socioId: number
  nombre: string
  iban: string
  mandatoId: string
  fechaMandato: string // YYYY-MM-DD
  secuencia: 'FRST' | 'RCUR'
  importe: number
  endToEndId: string
}

export interface ConfigRemesa {
  msgId: string
  fechaCobro: string // YYYY-MM-DD
  creditorNombre: string
  creditorIBAN: string
  creditorBIC: string
  creditorIAS: string // Identificador Acreedor SEPA
  concepto: string
}

function ibanToBic(_iban: string): string {
  // BIC no requerido en zona SEPA desde 2016 — se usa NOTPROVIDED
  return 'NOTPROVIDED'
}

function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

export function generarPain008(config: ConfigRemesa, deudores: DeudorSEPA[]): string {
  if (!deudores.length) throw new Error('No hay deudores')

  // Separar FRST y RCUR en bloques distintos (requerido por SEPA)
  const frst = deudores.filter(d => d.secuencia === 'FRST')
  const rcur = deudores.filter(d => d.secuencia === 'RCUR')

  const totalTxs = deudores.length
  const totalImporte = deudores.reduce((s, d) => s + d.importe, 0)
  const now = new Date().toISOString().replace('Z', '+00:00').slice(0, 19)

  const pmtInfBlocks = [
    ...(frst.length ? [buildPmtInf(`${config.msgId}-FRST`, 'FRST', frst, config)] : []),
    ...(rcur.length ? [buildPmtInf(`${config.msgId}-RCUR`, 'RCUR', rcur, config)] : []),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02 pain.008.001.02.xsd">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>${config.msgId}</MsgId>
      <CreDtTm>${now}</CreDtTm>
      <NbOfTxs>${totalTxs}</NbOfTxs>
      <CtrlSum>${formatAmount(totalImporte)}</CtrlSum>
      <InitgPty>
        <Nm>${escXml(config.creditorNombre)}</Nm>
      </InitgPty>
    </GrpHdr>
${pmtInfBlocks.join('\n')}
  </CstmrDrctDbtInitn>
</Document>`
}

function buildPmtInf(
  pmtInfId: string,
  seqTp: 'FRST' | 'RCUR',
  deudores: DeudorSEPA[],
  config: ConfigRemesa,
): string {
  const total = deudores.reduce((s, d) => s + d.importe, 0)

  const txs = deudores.map(d => `      <DrctDbtTxInf>
        <PmtId>
          <EndToEndId>${escXml(d.endToEndId)}</EndToEndId>
        </PmtId>
        <InstdAmt Ccy="EUR">${formatAmount(d.importe)}</InstdAmt>
        <DrctDbtTx>
          <MndtRltdInf>
            <MndtId>${escXml(d.mandatoId)}</MndtId>
            <DtOfSgntr>${d.fechaMandato}</DtOfSgntr>
          </MndtRltdInf>
          <CdtrSchmeId>
            <Id>
              <PrvtId>
                <Othr>
                  <Id>${escXml(config.creditorIAS)}</Id>
                  <SchmeNm><Prtry>SEPA</Prtry></SchmeNm>
                </Othr>
              </PrvtId>
            </Id>
          </CdtrSchmeId>
        </DrctDbtTx>
        <DbtrAgt>
          <FinInstnId><BIC>${ibanToBic(d.iban)}</BIC></FinInstnId>
        </DbtrAgt>
        <Dbtr>
          <Nm>${escXml(d.nombre)}</Nm>
        </Dbtr>
        <DbtrAcct>
          <Id><IBAN>${d.iban.replace(/\s/g, '')}</IBAN></Id>
        </DbtrAcct>
        <Purp><Cd>OTHR</Cd></Purp>
        <RmtInf><Ustrd>${escXml(config.concepto)}</Ustrd></RmtInf>
      </DrctDbtTxInf>`).join('\n')

  return `    <PmtInf>
      <PmtInfId>${escXml(pmtInfId)}</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <NbOfTxs>${deudores.length}</NbOfTxs>
      <CtrlSum>${formatAmount(total)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl><Cd>SEPA</Cd></SvcLvl>
        <LclInstrm><Cd>CORE</Cd></LclInstrm>
        <SeqTp>${seqTp}</SeqTp>
      </PmtTpInf>
      <ReqdColltnDt>${config.fechaCobro}</ReqdColltnDt>
      <Cdtr>
        <Nm>${escXml(config.creditorNombre)}</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id><IBAN>${config.creditorIBAN.replace(/\s/g, '')}</IBAN></Id>
      </CdtrAcct>
      <CdtrAgt>
        <FinInstnId><BIC>${config.creditorBIC || 'NOTPROVIDED'}</BIC></FinInstnId>
      </CdtrAgt>
${txs}
    </PmtInf>`
}

function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
