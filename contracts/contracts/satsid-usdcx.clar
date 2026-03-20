;; usdcx-token.clar
;; Mock USDCx Token for Testing (SIP-010 Compliant)
;; DO NOT USE IN PRODUCTION

(define-fungible-token usdcx)

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u501))

(define-constant TOKEN_NAME "Mock USDCx")
(define-constant TOKEN_SYMBOL "USDCx")
(define-constant TOKEN_DECIMALS u6)

(define-public (transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender from) ERR_UNAUTHORIZED)
    (try! (ft-transfer? usdcx amount from to))
    (match memo to-print (print to-print) 0x)
    (ok true)
  )
)

(define-read-only (get-name)
  (ok TOKEN_NAME)
)

(define-read-only (get-symbol)
  (ok TOKEN_SYMBOL)
)

(define-read-only (get-decimals)
  (ok TOKEN_DECIMALS)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance usdcx account))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply usdcx))
)

(define-read-only (get-token-uri)
  (ok none)
)

;; Faucet - anyone can mint testnet USDCx
(define-public (faucet (amount uint) (recipient principal))
  (begin
    ;; Limit to 10,000 USDCx per call
    (asserts! (<= amount u10000000000) ERR_UNAUTHORIZED)
    (ft-mint? usdcx amount recipient)
  )
)

(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (ft-mint? usdcx amount recipient)
  )
)
