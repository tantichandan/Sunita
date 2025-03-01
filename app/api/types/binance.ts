export interface Balance {
    asset: string
    free: string
    locked: string
  }
  
  export interface AccountInfo {
    balances: Balance[]
    makerCommission: number
    takerCommission: number
    buyerCommission: number
    sellerCommission: number
    canTrade: boolean
    canWithdraw: boolean
    canDeposit: boolean
    updateTime: number
    accountType: string
  }
  
  export interface BalanceResponse {
    success: boolean
    data?: AccountInfo
    error?: string
  }
  
  