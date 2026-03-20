;; satsid-core.clar
;; SatsID Identity Registry - Core Contract
;; Stores identity registrations and links wallets to on-chain profiles

;; ============================================
;; CONSTANTS
;; ============================================
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_ALREADY_REGISTERED (err u100))
(define-constant ERR_NOT_REGISTERED (err u101))
(define-constant ERR_UNAUTHORIZED (err u102))
(define-constant ERR_INVALID_INPUT (err u103))

;; ============================================
;; DATA MAPS & VARIABLES
;; ============================================

;; Main identity registry
(define-map identities
  principal
  {
    registered-at: uint,
    display-name: (string-utf8 64),
    bio: (string-utf8 256),
    is-verified: bool,
    reputation-score: uint,
    credential-count: uint,
    is-active: bool
  }
)

;; Track total registered identities
(define-data-var total-identities uint u0)

;; Map to track identity metadata hashes (for off-chain data integrity)
(define-map identity-metadata
  principal
  {
    avatar-hash: (buff 32),
    metadata-uri: (string-utf8 256)
  }
)

;; ============================================
;; PUBLIC FUNCTIONS
;; ============================================

;; Register a new identity
(define-public (register-identity (display-name (string-utf8 64)) (bio (string-utf8 256)))
  (let
    (
      (caller tx-sender)
      (current-block block-height)
    )
    (asserts! (is-none (map-get? identities caller)) ERR_ALREADY_REGISTERED)
    (asserts! (> (len display-name) u0) ERR_INVALID_INPUT)

    (map-set identities caller {
      registered-at: current-block,
      display-name: display-name,
      bio: bio,
      is-verified: false,
      reputation-score: u100,
      credential-count: u0,
      is-active: true
    })

    (var-set total-identities (+ (var-get total-identities) u1))

    (ok true)
  )
)

;; Update identity profile
(define-public (update-profile (display-name (string-utf8 64)) (bio (string-utf8 256)))
  (let
    (
      (caller tx-sender)
      (identity (unwrap! (map-get? identities caller) ERR_NOT_REGISTERED))
    )
    (asserts! (get is-active identity) ERR_UNAUTHORIZED)
    (asserts! (> (len display-name) u0) ERR_INVALID_INPUT)

    (map-set identities caller (merge identity {
      display-name: display-name,
      bio: bio
    }))

    (ok true)
  )
)

;; Update verification status (called by satsid-stake contract)
(define-public (set-verified (user principal) (verified bool))
  (let
    (
      (identity (unwrap! (map-get? identities user) ERR_NOT_REGISTERED))
    )
    (asserts! (is-eq contract-caller .satsid-stake) ERR_UNAUTHORIZED)

    (map-set identities user (merge identity {
      is-verified: verified
    }))

    (ok true)
  )
)

;; Update reputation score (called by satsid-stake or satsid-credentials)
(define-public (update-reputation (user principal) (new-score uint))
  (let
    (
      (identity (unwrap! (map-get? identities user) ERR_NOT_REGISTERED))
    )
    (asserts! (or
      (is-eq contract-caller .satsid-stake)
      (is-eq contract-caller .satsid-credentials)
    ) ERR_UNAUTHORIZED)
    (asserts! (<= new-score u1000) ERR_INVALID_INPUT)

    (map-set identities user (merge identity {
      reputation-score: new-score
    }))

    (ok true)
  )
)

;; Increment credential count (called by satsid-credentials)
(define-public (increment-credentials (user principal))
  (let
    (
      (identity (unwrap! (map-get? identities user) ERR_NOT_REGISTERED))
    )
    (asserts! (is-eq contract-caller .satsid-credentials) ERR_UNAUTHORIZED)

    (map-set identities user (merge identity {
      credential-count: (+ (get credential-count identity) u1)
    }))

    (ok true)
  )
)

;; Deactivate identity
(define-public (deactivate-identity)
  (let
    (
      (caller tx-sender)
      (identity (unwrap! (map-get? identities caller) ERR_NOT_REGISTERED))
    )
    (map-set identities caller (merge identity {
      is-active: false
    }))

    (ok true)
  )
)

;; Set metadata
(define-public (set-metadata (avatar-hash (buff 32)) (metadata-uri (string-utf8 256)))
  (let
    (
      (caller tx-sender)
    )
    (asserts! (is-some (map-get? identities caller)) ERR_NOT_REGISTERED)

    (map-set identity-metadata caller {
      avatar-hash: avatar-hash,
      metadata-uri: metadata-uri
    })

    (ok true)
  )
)

;; ============================================
;; READ-ONLY FUNCTIONS
;; ============================================

(define-read-only (get-identity (user principal))
  (map-get? identities user)
)

(define-read-only (is-registered (user principal))
  (is-some (map-get? identities user))
)

(define-read-only (get-reputation (user principal))
  (match (map-get? identities user)
    identity (ok (get reputation-score identity))
    ERR_NOT_REGISTERED
  )
)

(define-read-only (is-verified (user principal))
  (match (map-get? identities user)
    identity (ok (get is-verified identity))
    ERR_NOT_REGISTERED
  )
)

(define-read-only (get-metadata (user principal))
  (map-get? identity-metadata user)
)

(define-read-only (get-total-identities)
  (var-get total-identities)
)
