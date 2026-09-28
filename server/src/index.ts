import { env } from './env.js'
import cors from 'cors'
import express from 'express'
import { errorHandler } from './middleware/errorHandler.js'
import { alertsRouter } from './routes/alerts.js'
import { demoRouter } from './routes/demo.js'
import { diagnosisRouter } from './routes/diagnosis.js'
import { farmsRouter } from './routes/farms.js'
import { marketRouter } from './routes/market.js'
import { npkRouter } from './routes/npk.js'
import { pumpRouter } from './routes/pump.js'
import { readingsRouter } from './routes/readings.js'

const app = express()

app.use(cors({ origin: env.FRONTEND_ORIGIN }))
app.use(express.json({ limit: '256kb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use('/api', farmsRouter)
app.use('/api', readingsRouter)
app.use('/api', npkRouter)
app.use('/api', pumpRouter)
app.use('/api', diagnosisRouter)
app.use('/api', marketRouter)
app.use('/api', alertsRouter)
app.use('/api', demoRouter)

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))
app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`AgriSaarthi backend listening on http://localhost:${env.PORT}`)
})
