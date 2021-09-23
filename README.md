# pota-sota-validator

https://billyf.github.io/pota-sota-validator/

Not official, just some sanity checks on ADIF files for POTA and SOTA:

- Checks if the chasers have particiated in POTA/SOTA before (helps find typos in call signs).  
Links to QRZ page for comparing against the logged QTH.

- Verifies that records have the mandatory fields:
   - **POTA**: QSO_DATE, TIME_ON, BAND, MODE, CALL, STATION_CALLSIGN, MY_SIG_INFO
   - **SOTA**: QSO_DATE, TIME_ON, BAND, MODE, CALL, STATION_CALLSIGN, MY_SOTA_REF

- Lists records marked as park-to-park (P2P) or summit-to-summt (S2S)

