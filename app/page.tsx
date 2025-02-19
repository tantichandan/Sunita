import Balance from "@/components/Balance"
import SolanaHistoricalChart from "@/components/BinanceRealTimeData"
import OrderPage from "@/components/OrderHistory"
import SolanaAnalyzer from "@/components/SolanaAnalyzer"
import SolanaPriceMonitorandTrade from "@/components/SolanaPriceMonitor"
import SolanaPriceMonitor from "@/components/SolanaPriceMonitor"
import TradeMonitor from "@/components/TradeMonitor"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-24">
      <h1 className="text-4xl font-bold mb-8">Solana AI Trader</h1>
      
      

      <SolanaHistoricalChart />
      <SolanaPriceMonitor />
      <SolanaAnalyzer /> 
      <TradeMonitor/>
      <Balance />
      <OrderPage />
      
      
      
      
    </main>
  )
}

