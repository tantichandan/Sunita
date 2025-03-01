// Technical analysis library for Solana price data
// This file contains functions to calculate various technical indicators

type Candle = {
    time: string
    open: number
    high: number
    low: number
    close: number
    volume: number
  }
  
  export function technicalAnalysis(historicalData: Candle[]) {
    // Make sure we have enough data
    if (!historicalData || historicalData.length < 30) {
      return {
        rsi: null,
        macd: null,
        bollingerBands: null,
        movingAverages: null,
        summary: {
          signal: "NEUTRAL",
          strength: 0,
        },
      }
    }
  
    // Calculate RSI (Relative Strength Index)
    const rsi = calculateRSI(historicalData)

    console.log("RSI:", rsi);
  
    // Calculate MACD (Moving Average Convergence Divergence)
    const macd = calculateMACD(historicalData)

    console.log("Calculating MACD...");
    console.log("MACD:", macd);
  
    // Calculate Bollinger Bands
    console.log("Calculating Bollinger Bands...");


    const bollingerBands = calculateBollingerBands(historicalData)
    console.log("Bollinger Bands:", bollingerBands);

  
    // Calculate Moving Averages
    console.log("Calculating Moving Averages...");
    const movingAverages = calculateMovingAverages(historicalData)
    console.log("Moving Averages:", movingAverages);
  
    // Generate summary signal
    console.log("summary:", generateSignalSummary)
    const summary = generateSignalSummary(rsi, macd, bollingerBands, movingAverages)
  
    return {
      rsi,
      macd,
      bollingerBands,
      movingAverages,
      summary,
    }
  }
  
  function calculateRSI(data: Candle[], period = 14) {
    if (data.length < period + 1) {
      return { value: 50, signal: "NEUTRAL" }
    }
  
    // Get only the closing prices
    const closes = data.map((candle) => candle.close)
  
    // Calculate price changes
    const changes = []
    for (let i = 1; i < closes.length; i++) {
      changes.push(closes[i] - closes[i - 1])
    }
  
    // Get gains and losses
    const gains = changes.map((change) => (change > 0 ? change : 0))
    const losses = changes.map((change) => (change < 0 ? Math.abs(change) : 0))
  
    // Calculate average gain and average loss
    let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period
    let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period
  
    // Calculate RSI for the first period
    let rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss) // Avoid division by zero
    const rsiValues = [100 - 100 / (1 + rs)]
  
    // Calculate RSI for the remaining periods
    for (let i = period; i < changes.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period
      rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss)
      rsiValues.push(100 - 100 / (1 + rs))
    }
  
    const currentRSI = rsiValues[rsiValues.length - 1]
  
    // Determine signal based on RSI value
    let signal = "NEUTRAL"
    if (currentRSI > 70) signal = "SELL"
    else if (currentRSI < 30) signal = "BUY"
  
    return {
      value: currentRSI,
      signal,
      overbought: currentRSI > 70,
      oversold: currentRSI < 30,
    }
  }
  
  function calculateMACD(data: Candle[]) {
    if (data.length < 26) {
      return {
        line: 0,
        signal: 0,
        histogram: 0,
        trend: "NEUTRAL",
      }
    }
  
    const closes = data.map((candle) => candle.close)
  
    // Calculate EMAs
    const ema12 = calculateEMA(closes, 12)
    const ema26 = calculateEMA(closes, 26)
  
    // Calculate MACD line
    const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1]
  
    // Calculate MACD signal line (9-day EMA of MACD line)
    // For simplicity, we'll use a simple approximation
    const macdSignal = calculateEMA([...Array(8).fill(macdLine), macdLine], 9)[0]
  
    // Calculate MACD histogram
    const histogram = macdLine - macdSignal
  
    // Determine trend
    let trend = "NEUTRAL"
    if (macdLine > macdSignal && histogram > 0) trend = "BUY"
    else if (macdLine < macdSignal && histogram < 0) trend = "SELL"
  
    return {
      line: macdLine,
      signal: macdSignal,
      histogram,
      trend,
    }
  }
  
  function calculateEMA(data: number[], period: number) {
    const k = 2 / (period + 1)
  
    // Start with SMA for the first EMA value
    const sma = data.slice(0, period).reduce((sum, price) => sum + price, 0) / period
  
    // Calculate EMAs
    const emas = [sma]
    for (let i = period; i < data.length; i++) {
      emas.push(data[i] * k + emas[emas.length - 1] * (1 - k))
    }
  
    return emas
  }
  
  function calculateBollingerBands(data: Candle[], period = 20, multiplier = 2) {
    if (data.length < period) {
      return {
        upper: data[data.length - 1].close * 1.05,
        middle: data[data.length - 1].close,
        lower: data[data.length - 1].close * 0.95,
        width: 0.1,
        signal: "NEUTRAL",
      }
    }
  
    const closes = data.map((candle) => candle.close)
  
    // Calculate SMA (middle band)
    const sma = closes.slice(-period).reduce((sum, price) => sum + price, 0) / period
  
    // Calculate standard deviation
    const squaredDifferences = closes.slice(-period).map((price) => Math.pow(price - sma, 2))
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / period
    const stdDev = Math.sqrt(variance)
  
    // Calculate upper and lower bands
    const upperBand = sma + multiplier * stdDev
    const lowerBand = sma - multiplier * stdDev
  
    // Calculate bandwidth
    const bandwidth = (upperBand - lowerBand) / sma
  
    // Current price
    const currentPrice = closes[closes.length - 1]
  
    // Determine signal
    let signal = "NEUTRAL"
    if (currentPrice > upperBand) signal = "SELL"
    else if (currentPrice < lowerBand) signal = "BUY"
  
    return {
      upper: upperBand,
      middle: sma,
      lower: lowerBand,
      width: bandwidth,
      signal,
    }
  }
  
  function calculateMovingAverages(data: Candle[]) {
    const closes = data.map((candle) => candle.close)
  
    // Calculate different MAs
    const ma7 = calculateMA(closes, 7)
    const ma25 = calculateMA(closes, 25)
    const ma99 = calculateMA(closes, Math.min(99, closes.length - 1))
  
    // Determine crossovers and trends
    const goldCross = ma7 > ma25 && ma25 > ma99
    const deathCross = ma7 < ma25 && ma25 < ma99
  
    // Determine signal
    let signal = "NEUTRAL"
    if (goldCross) signal = "BUY"
    else if (deathCross) signal = "SELL"
  
    return {
      ma7,
      ma25,
      ma99,
      goldCross,
      deathCross,
      signal,
    }
  }
  
  function calculateMA(data: number[], period: number) {
    if (data.length < period) return data[data.length - 1]
    return data.slice(-period).reduce((sum, price) => sum + price, 0) / period
  }

  
  
  function generateSignalSummary(rsi: any, macd: any, bollingerBands: any, movingAverages: any) {


  
    // Count buy and sell signals
    let buySignals = 0
    let sellSignals = 0
    let validSignals = 0
  
    // RSI
    if (rsi && rsi.signal) {
      validSignals++
      if (rsi.signal === "BUY") buySignals++
      else if (rsi.signal === "SELL") sellSignals++
    }
  
    // MACD
    if (macd && macd.trend) {
      validSignals++
      if (macd.trend === "BUY") buySignals++
      else if (macd.trend === "SELL") sellSignals++
    }
  
    // Bollinger Bands
    if (bollingerBands && bollingerBands.signal) {
      validSignals++
      if (bollingerBands.signal === "BUY") buySignals++
      else if (bollingerBands.signal === "SELL") sellSignals++
    }
  
    // Moving Averages
    if (movingAverages && movingAverages.signal) {
      validSignals++
      if (movingAverages.signal === "BUY") buySignals++
      else if (movingAverages.signal === "SELL") sellSignals++
    }
  
    // Calculate signal strength (0-100)
    // If no valid signals, default to 0
    const totalSignals = validSignals || 1 // Avoid division by zero
    const strength = Math.round((Math.max(buySignals, sellSignals) / totalSignals) * 100)
  
    // Determine overall signal
    let signal = "NEUTRAL"
    if (buySignals > sellSignals) signal = "BUY"
    else if (sellSignals > buySignals) signal = "SELL"



  
    // Ensure we always return at least some values even if calculations failed
    return {
      signal,
      strength: isNaN(strength) ? 0 : strength,
      buySignals: buySignals || 0,
      sellSignals: sellSignals || 0,
    }
  }
  
  