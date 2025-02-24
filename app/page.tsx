
import SolanaAnalyzerandTrade from "@/components/automateTradeAfterAnalyse"
import Balance from "@/components/Balance"
import SolanaHistoricalChart from "@/components/BinanceRealTimeData"
import NewestTweets from "@/components/NewTweet"
import SolanaTweets from "@/components/NewTweet"


import OrderPage from "@/components/OrderHistory"
import SolanaPriceMonitorBinance from "@/components/realtimeBinance"
import SolanaAnalyzer from "@/components/SolanaAnalyzer"
import SolanaPriceMonitor from "@/components/SolanaPriceMonitor"
import TradeMonitor from "@/components/TradeMonitor"
import SolanaNews from "@/components/TweetFeed"



export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-24">
      <h1 className="text-4xl font-bold mb-8">Solana AI Trader</h1>
      
      

      <SolanaHistoricalChart />
      <SolanaPriceMonitor />
      <SolanaPriceMonitorBinance />
      <SolanaAnalyzer /> 
      <TradeMonitor/>
      <Balance />
      
      <SolanaAnalyzerandTrade/>
      <OrderPage />
      <NewestTweets/>
      
      
      
      
      <SolanaNews/>
      
     
      
      
      
      
      
    </main>
  )
}

