;; sbtc-token.clar
;; Mock sBTC Token for Testing (SIP-010 Compliant)
;; DO NOT USE IN PRODUCTION - this is for testnet/devnet only

(define-fungible-token sbtc)

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_INSUFFICIENT_BALANCE (err u402))

(define-constant TOKEN_NAME "Mock sBTC")
(define-constant TOKEN_SYMBOL "sBTC")
(define-constant TOKEN_DECIMALS u8)

;; SIP-010 Functions

(define-public (transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender from) ERR_UNAUTHORIZED)
    (try! (ft-transfer? sbtc amount from to))
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
  (ok (ft-get-balance sbtc account))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply sbtc))
)

(define-read-only (get-token-uri)
  (ok none)
)

;; Faucet function - anyone can mint testnet tokens
(define-public (faucet (amount uint) (recipient principal))
  (begin
    ;; Limit faucet to 1 sBTC (100,000,000 micro) per call
    (asserts! (<= amount u100000000) ERR_UNAUTHORIZED)
    (ft-mint? sbtc amount recipient)
  )
)

;; Owner can mint any amount
(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (ft-mint? sbtc amount recipient)
  )
)
