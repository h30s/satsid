;; satsid-credentials.clar
;; SatsID On-Chain Credential System
;; Institutions issue credentials, verifiers pay x402 to check them

;; ============================================
;; CONSTANTS
;; ============================================
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_REGISTERED (err u300))
(define-constant ERR_UNAUTHORIZED (err u301))
(define-constant ERR_NOT_ISSUER (err u302))
(define-constant ERR_CREDENTIAL_EXISTS (err u303))
(define-constant ERR_CREDENTIAL_NOT_FOUND (err u304))
(define-constant ERR_CREDENTIAL_REVOKED (err u305))
(define-constant ERR_INVALID_INPUT (err u306))

;; ============================================
;; DATA MAPS & VARIABLES
;; ============================================

;; Approved credential issuers
(define-map issuers
  principal
  {
    name: (string-utf8 128),
    is-approved: bool,
    credentials-issued: uint,
    registered-at: uint
  }
)

;; Credential records
(define-map credentials
  uint
  {
    issuer: principal,
    recipient: principal,
    credential-type: (string-utf8 64),
    title: (string-utf8 128),
    description: (string-utf8 512),
    data-hash: (buff 32),
    issued-at: uint,
    expires-at: uint,
    is-revoked: bool
  }
)

;; Map recipient to their credential IDs
(define-map recipient-credentials
  { recipient: principal, index: uint }
  uint
)

;; Track how many credentials each recipient has
(define-map recipient-credential-count
  principal
  uint
)

;; Auto-incrementing credential ID
(define-data-var next-credential-id uint u1)

;; Total credentials issued
(define-data-var total-credentials uint u0)

;; ============================================
;; PUBLIC FUNCTIONS
;; ============================================

;; Register as a credential issuer
(define-public (register-issuer (name (string-utf8 128)))
  (let
    (
      (caller tx-sender)
    )
    (asserts! (contract-call? .satsid-core is-registered caller) ERR_NOT_REGISTERED)
    (asserts! (> (len name) u0) ERR_INVALID_INPUT)

    (map-set issuers caller {
      name: name,
      is-approved: true,
      credentials-issued: u0,
      registered-at: block-height
    })

    (ok true)
  )
)

;; Issue a credential to a recipient
(define-public (issue-credential
  (recipient principal)
  (credential-type (string-utf8 64))
  (title (string-utf8 128))
  (description (string-utf8 512))
  (data-hash (buff 32))
  (expires-at uint))
  (let
    (
      (caller tx-sender)
      (issuer-data (unwrap! (map-get? issuers caller) ERR_NOT_ISSUER))
      (cred-id (var-get next-credential-id))
      (recipient-count (default-to u0 (map-get? recipient-credential-count recipient)))
    )
    (asserts! (get is-approved issuer-data) ERR_UNAUTHORIZED)
    (asserts! (contract-call? .satsid-core is-registered recipient) ERR_NOT_REGISTERED)
    (asserts! (> (len credential-type) u0) ERR_INVALID_INPUT)
    (asserts! (> (len title) u0) ERR_INVALID_INPUT)

    ;; Store credential
    (map-set credentials cred-id {
      issuer: caller,
      recipient: recipient,
      credential-type: credential-type,
      title: title,
      description: description,
      data-hash: data-hash,
      issued-at: block-height,
      expires-at: expires-at,
      is-revoked: false
    })

    ;; Link credential to recipient
    (map-set recipient-credentials { recipient: recipient, index: recipient-count } cred-id)
    (map-set recipient-credential-count recipient (+ recipient-count u1))

    ;; Update issuer stats
    (map-set issuers caller (merge issuer-data {
      credentials-issued: (+ (get credentials-issued issuer-data) u1)
    }))

    ;; Update recipient's credential count in core
    (try! (contract-call? .satsid-core increment-credentials recipient))

    ;; Increment ID
    (var-set next-credential-id (+ cred-id u1))
    (var-set total-credentials (+ (var-get total-credentials) u1))

    (ok cred-id)
  )
)

;; Revoke a credential (issuer only)
(define-public (revoke-credential (credential-id uint))
  (let
    (
      (caller tx-sender)
      (cred (unwrap! (map-get? credentials credential-id) ERR_CREDENTIAL_NOT_FOUND))
    )
    (asserts! (is-eq caller (get issuer cred)) ERR_UNAUTHORIZED)
    (asserts! (not (get is-revoked cred)) ERR_CREDENTIAL_REVOKED)

    (map-set credentials credential-id (merge cred {
      is-revoked: true
    }))

    (ok true)
  )
)

;; ============================================
;; READ-ONLY FUNCTIONS
;; ============================================

(define-read-only (get-credential (credential-id uint))
  (map-get? credentials credential-id)
)

(define-read-only (verify-credential (credential-id uint))
  (match (map-get? credentials credential-id)
    cred (ok {
      is-valid: (and
        (not (get is-revoked cred))
        (or (is-eq (get expires-at cred) u0) (< block-height (get expires-at cred)))
      ),
      issuer: (get issuer cred),
      recipient: (get recipient cred),
      credential-type: (get credential-type cred),
      title: (get title cred),
      issued-at: (get issued-at cred),
      is-revoked: (get is-revoked cred),
      is-expired: (and (> (get expires-at cred) u0) (>= block-height (get expires-at cred)))
    })
    ERR_CREDENTIAL_NOT_FOUND
  )
)

(define-read-only (get-issuer (addr principal))
  (map-get? issuers addr)
)

(define-read-only (get-recipient-credential-id (recipient principal) (index uint))
  (map-get? recipient-credentials { recipient: recipient, index: index })
)

(define-read-only (get-recipient-credential-count (recipient principal))
  (default-to u0 (map-get? recipient-credential-count recipient))
)

(define-read-only (get-total-credentials)
  (var-get total-credentials)
)
