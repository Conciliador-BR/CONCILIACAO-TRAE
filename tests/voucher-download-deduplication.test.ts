import assert from 'node:assert/strict'
import {
  buildVrRemoteSelection,
  buildVrSafeDownloadName,
  parseVrSafeDownloadName
} from '../server/utils/vrRemoteSftp'

const remoteName = 'VR_ECONOMICCARD_10478994000100_20260924.txt'
const existingName = buildVrSafeDownloadName(remoteName, '20260924_120000')
const parsedExisting = parseVrSafeDownloadName(existingName)

const selection = buildVrRemoteSelection({
  remoteFiles: [remoteName],
  downloadedFiles: [{
    fileName: existingName,
    originalStem: parsedExisting.originalStem,
    referenceDate: parsedExisting.referenceDate
  }],
  cnpj: '10478994000100',
  dataInicial: '2026-09-01',
  dataFinal: '2026-09-30',
  fixedRemoteName: ''
})

assert.equal(selection.selected.length, 1)
assert.equal(selection.selected[0]?.shouldDownload, false)
assert.equal(selection.selected[0]?.skippedReason, 'arquivo_ja_existente')

// Even a forged legacy overwrite parameter cannot reactivate duplicate downloads.
const forgedSelection = buildVrRemoteSelection({
  remoteFiles: [remoteName],
  downloadedFiles: [{
    fileName: existingName,
    originalStem: parsedExisting.originalStem,
    referenceDate: parsedExisting.referenceDate
  }],
  cnpj: '10478994000100',
  dataInicial: '2026-09-01',
  dataFinal: '2026-09-30',
  fixedRemoteName: '',
  overwrite: true
} as Parameters<typeof buildVrRemoteSelection>[0])

assert.equal(forgedSelection.selected[0]?.shouldDownload, false)

console.log('Voucher download deduplication test passed.')
