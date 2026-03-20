;; satsid-stake.clar
;; SatsID sBTC Reputation Staking & Slashing
;; Users stake sBTC to prove "skin in the game"
;; Fraudulent identities get slashed

;; ============================================
;; CONSTANTS
;; ============================================
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_REGISTERED (err u200))
(define-constant ERR_ALREADY_STAKED (err u201))
(define-constant ERR_NOT_STAKED (err u202))
(define-constant ERR_INSUFFICIENT_STAKE (err u203))
(define-constant ERR_UNAUTHORIZED (err u204))
(define-constant ERR_CHALLENGE_EXISTS (err u205))
(define-constant ERR_NO_CHALLENGE (err u206))
(define-constant ERR_CANNOT_CHALLENGE_SELF (err u207))
(define-constant ERR_CHALLENGE_EXPIRED (err u208))
(define-constant ERR_COOLDOWN_ACTIVE (err u209))
(define-constant ERR_INVALID_AMOUNT (err u210))

;; Minimum stake: 100,000 micro-sBTC = 0.001 sBTC
(define-constant MIN_STAKE u100000)
;; Challenge bond: must match 50% of target's stake
(define-constant CHALLENGE_BOND_PERCENT u50)
;; Challenge resolution period: ~144 blocks (~24 hours on Stacks)
(define-constant CHALLENGE_PERIOD u144)
;; Unstake cooldown: ~720 blocks (~5 days)
(define-constant UNSTAKE_COOLDOWN u720)

;; ============================================
;; DATA MAPS & VARIABLES
;; ============================================

;; Stake records
(define-map stakes
  principal
  {
    amount: uint,
    staked-at: uint,
    last-activity: uint,
    is-locked: bool,
    unstake-requested-at: uint
  }
)

;; Challenge records
(define-map challenges
  { challenger: principal, target: principal }
  {
    bond-amount: uint,
    created-at: uint,
    reason: (string-utf8 256),
    resolved: bool,
    outcome: bool
  }
)

;; Track active challenges per target
(define-map active-challenges
  principal
  { challenger: principal, is-active: bool }
)

;; Arbiters (trusted addresses that can resolve challenges)
(define-map arbiters principal bool)

;; Total staked across all users
(define-data-var total-staked uint u0)

;; ============================================
;; PUBLIC FUNCTIONS
;; ============================================

;; Stake sBTC for verified status
(define-public (stake-sbtc (amount uint))
  (let
    (
      (caller tx-sender)
      (current-block block-height)
    )
    (asserts! (contract-call? .satsid-core is-registered caller) ERR_NOT_REGISTERED)
    (asserts! (is-none (map-get? stakes caller)) ERR_ALREADY_STAKED)
    (asserts! (>= amount MIN_STAKE) ERR_INSUFFICIENT_STAKE)

    ;; Transfer sBTC from user to this contract
    (try! (contract-call? .satsid-sbtc transfer amount caller (as-contract tx-sender) none))

    ;; Record stake
    (map-set stakes caller {
      amount: amount,
      staked-at: current-block,
      last-activity: current-block,
      is-locked: false,
      unstake-requested-at: u0
    })

    (var-set total-staked (+ (var-get total-staked) amount))

    ;; Set verified status in core contract
    (try! (contract-call? .satsid-core set-verified caller true))

    ;; Boost reputation based on stake amount
    (try! (update-reputation-for-stake caller amount))

    (ok true)
  )
)

;; Increase existing stake
(define-public (increase-stake (additional-amount uint))
  (let
    (
      (caller tx-sender)
      (stake (unwrap! (map-get? stakes caller) ERR_NOT_STAKED))
      (new-amount (+ (get amount stake) additional-amount))
    )
    (asserts! (> additional-amount u0) ERR_INVALID_AMOUNT)
    (asserts! (not (get is-locked stake)) ERR_COOLDOWN_ACTIVE)

    (try! (contract-call? .satsid-sbtc transfer additional-amount caller (as-contract tx-sender) none))

    (map-set stakes caller (merge stake {
      amount: new-amount,
      last-activity: block-height
    }))

    (var-set total-staked (+ (var-get total-staked) additional-amount))

    (try! (update-reputation-for-stake caller new-amount))

    (ok true)
  )
)

;; Request unstake (starts cooldown period)
(define-public (request-unstake)
  (let
    (
      (caller tx-sender)
      (stake (unwrap! (map-get? stakes caller) ERR_NOT_STAKED))
    )
    (asserts! (not (get is-locked stake)) ERR_COOLDOWN_ACTIVE)
    (asserts! (is-eq (get unstake-requested-at stake) u0) ERR_COOLDOWN_ACTIVE)

    (map-set stakes caller (merge stake {
      unstake-requested-at: block-height
    }))

    (ok true)
  )
)

;; Complete unstake (after cooldown)
(define-public (complete-unstake)
  (let
    (
      (caller tx-sender)
      (stake (unwrap! (map-get? stakes caller) ERR_NOT_STAKED))
      (unstake-block (get unstake-requested-at stake))
      (amount (get amount stake))
    )
    (asserts! (> unstake-block u0) ERR_NOT_STAKED)
    (asserts! (>= block-height (+ unstake-block UNSTAKE_COOLDOWN)) ERR_COOLDOWN_ACTIVE)
    (asserts! (not (get is-locked stake)) ERR_COOLDOWN_ACTIVE)

    ;; Transfer sBTC back to user
    (try! (as-contract (contract-call? .satsid-sbtc transfer amount tx-sender caller none)))

    (map-delete stakes caller)

    (var-set total-staked (- (var-get total-staked) amount))

    (try! (contract-call? .satsid-core set-verified caller false))
    (try! (contract-call? .satsid-core update-reputation caller u100))

    (ok true)
  )
)

;; Challenge a suspicious identity
(define-public (challenge-identity (target principal) (reason (string-utf8 256)))
  (let
    (
      (challenger tx-sender)
      (target-stake (unwrap! (map-get? stakes target) ERR_NOT_STAKED))
      (bond-amount (/ (* (get amount target-stake) CHALLENGE_BOND_PERCENT) u100))
    )
    (asserts! (not (is-eq challenger target)) ERR_CANNOT_CHALLENGE_SELF)
    (asserts! (contract-call? .satsid-core is-registered challenger) ERR_NOT_REGISTERED)
    (asserts! (is-none (map-get? active-challenges target)) ERR_CHALLENGE_EXISTS)
    (asserts! (>= bond-amount MIN_STAKE) ERR_INSUFFICIENT_STAKE)

    ;; Transfer challenger's bond
    (try! (contract-call? .satsid-sbtc transfer bond-amount challenger (as-contract tx-sender) none))

    ;; Lock target's stake
    (map-set stakes target (merge target-stake { is-locked: true }))

    ;; Record challenge
    (map-set challenges { challenger: challenger, target: target } {
      bond-amount: bond-amount,
      created-at: block-height,
      reason: reason,
      resolved: false,
      outcome: false
    })

    (map-set active-challenges target { challenger: challenger, is-active: true })

    (ok true)
  )
)

;; Resolve challenge (arbiter only)
(define-public (resolve-challenge (challenger principal) (target principal) (is-fraud bool))
  (let
    (
      (arbiter tx-sender)
      (challenge (unwrap! (map-get? challenges { challenger: challenger, target: target }) ERR_NO_CHALLENGE))
      (target-stake (unwrap! (map-get? stakes target) ERR_NOT_STAKED))
    )
    ;; Only arbiters can resolve
    (asserts! (or (is-eq arbiter CONTRACT_OWNER) (default-to false (map-get? arbiters arbiter))) ERR_UNAUTHORIZED)
    (asserts! (not (get resolved challenge)) ERR_NO_CHALLENGE)

    (if is-fraud
      ;; FRAUD CONFIRMED: slash target, reward challenger
      (begin
        ;; Transfer target's stake to challenger (slash)
        (try! (as-contract (contract-call? .satsid-sbtc transfer
          (get amount target-stake) tx-sender challenger none)))
        ;; Return challenger's bond
        (try! (as-contract (contract-call? .satsid-sbtc transfer
          (get bond-amount challenge) tx-sender challenger none)))

        (var-set total-staked (- (var-get total-staked) (get amount target-stake)))

        (map-delete stakes target)

        ;; Destroy target's verification and reputation
        (try! (contract-call? .satsid-core set-verified target false))
        (try! (contract-call? .satsid-core update-reputation target u0))

        ;; Boost challenger's reputation
        (match (map-get? stakes challenger)
          cstake (try! (update-reputation-for-stake challenger (get amount cstake)))
          true
        )

        (map-set challenges { challenger: challenger, target: target }
          (merge challenge { resolved: true, outcome: true }))
        (map-delete active-challenges target)

        (ok true)
      )
      ;; CHALLENGE REJECTED: slash challenger's bond, reward target
      (begin
        ;; Transfer challenger's bond to target
        (try! (as-contract (contract-call? .satsid-sbtc transfer
          (get bond-amount challenge) tx-sender target none)))

        ;; Unlock target's stake
        (map-set stakes target (merge target-stake { is-locked: false }))

        (map-set challenges { challenger: challenger, target: target }
          (merge challenge { resolved: true, outcome: false }))
        (map-delete active-challenges target)

        (ok true)
      )
    )
  )
)

;; Add arbiter (owner only)
(define-public (add-arbiter (arbiter principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (map-set arbiters arbiter true)
    (ok true)
  )
)

;; ============================================
;; PRIVATE FUNCTIONS
;; ============================================

(define-private (update-reputation-for-stake (user principal) (amount uint))
  (let
    (
      (stake-bonus (if (>= amount u10000000) u400
                    (if (>= amount u1000000) u300
                    (if (>= amount u100000) u200
                    u100))))
      (new-score (+ u100 stake-bonus))
    )
    (contract-call? .satsid-core update-reputation user new-score)
  )
)

;; ============================================
;; READ-ONLY FUNCTIONS
;; ============================================

(define-read-only (get-stake (user principal))
  (map-get? stakes user)
)

(define-read-only (get-stake-amount (user principal))
  (match (map-get? stakes user)
    stake (ok (get amount stake))
    (err u0)
  )
)

(define-read-only (get-challenge (challenger principal) (target principal))
  (map-get? challenges { challenger: challenger, target: target })
)

(define-read-only (get-active-challenge (target principal))
  (map-get? active-challenges target)
)

(define-read-only (get-total-staked)
  (var-get total-staked)
)

(define-read-only (is-arbiter (addr principal))
  (default-to false (map-get? arbiters addr))
)
