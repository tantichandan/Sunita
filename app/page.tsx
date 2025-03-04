import BalancePage from "@/components/Account"
import AccountBalance from "@/components/Account"
import SolanaAnalyzerandTrade from "@/components/automateTradeAfterAnalyse"

import SolanaHistoricalChart from "@/components/BinanceRealTimeData"
import TweetsComponent from "@/components/FirebaseTweets"
import FetchTweets from "@/components/FirebaseTweets"
import SolanaTweets1 from "@/components/FirebaseTweets"
import SolanaAnalyzer1 from "@/components/New"
import SolanaAnalyzerFifteenMinutes from "@/components/Newpro"
import SolanaPredictionDashboard from "@/components/Newpro"

import NewestTweets from "@/components/NewTweet"

import OrderPage from "@/components/OrderHistory"

import SolanaPriceMonitorBinance from "@/components/realtimeBinance"
import SolanaAnalyzer from "@/components/SolanaAnalyzer"
import SolanaPriceMonitor from "@/components/SolanaPriceMonitor"
import TradeMonitor from "@/components/TradeMonitor"
import NewestTweets1 from "@/components/Tweet"


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-8 bg-gray-50">
      <h1 className="text-4xl font-extrabold text-indigo-700 mb-8">Solana AI Trader</h1>
      
      {/* Section: Analyzer & Trading */}
      <section className="w-full max-w-6xl p-6 bg-white shadow-lg rounded-lg mb-8">
      <SolanaAnalyzer1 />
        
      </section>

      {/* Section: Solana Price Monitor */}
      <section className="w-full max-w-6xl p-6 bg-white shadow-lg rounded-lg mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <SolanaPriceMonitor />
        <SolanaPriceMonitorBinance />
      </section>

      {/* Section: Historical Chart */}
      <section className="w-full max-w-6xl p-6 bg-white shadow-lg rounded-lg mb-8">
        <SolanaHistoricalChart />
      </section>

      {/* Section: Account and Balance */}
      <section className="w-full max-w-6xl p-6 bg-white shadow-lg rounded-lg mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <BalancePage />
        <SolanaAnalyzerandTrade />
        
      </section>

      <section className="w-full max-w-6xl p-6 bg-white shadow-lg rounded-lg mb-8">
        <TradeMonitor />
      </section>

      <section className="w-full max-w-6xl p-6 bg-white shadow-lg rounded-lg mb-8">
        <OrderPage />
      </section>

      <section className="w-full max-w-6xl p-6 bg-white shadow-lg rounded-lg mb-8">
        <SolanaAnalyzerFifteenMinutes />
      </section>



      

      {/* Section: Tweets and News */}
      <section className="w-full max-w-6xl p-6 bg-white shadow-lg rounded-lg mb-8">
        <NewestTweets1 />
      </section>

      {/* Section: Trade Monitoring */}
     

      {/* Section: Order History */}
     

      {/* Section: Solana Analyzer */}
      <section className="w-full max-w-6xl p-6 bg-white shadow-lg rounded-lg mb-8">
        
      </section>
    </main>
  )
}
