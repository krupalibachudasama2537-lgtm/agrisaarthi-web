import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { db } from '../firebase.js'
import { env } from '../env.js'
import { asyncHandler, HttpError } from '../middleware/asyncHandler.js'
import { shortId } from '../lib/ids.js'
import { pickByFile } from '../lib/pickByFile.js'
import type { DiseaseDiagnosis, PestDiagnosis } from '../types.js'

export const diagnosisRouter = Router()

const upload = multer({
  storage: multer.diskStorage({
    destination: env.UPLOADS_DIR,
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname) || '.jpg'}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
})

/**
 * There is no real vision model wired up here (see server/README.md). This
 * picks a canned result from the seeded reference table, deterministically
 * by file name+size so re-uploading the same photo gives the same answer –
 * matching the frontend's old mock behaviour exactly. Swap the two
 * `pickByFile(...)` calls below for a real inference call to go live.
 */
diagnosisRouter.post(
  '/diagnose/leaf',
  upload.single('photo'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Missing "photo" file field')
    const refs = await db.collection('diseaseReference').get()
    const list = refs.docs.map((d) => d.data() as DiseaseDiagnosis)
    if (list.length === 0) throw new HttpError(500, 'No disease reference data seeded – run `npm run seed`')

    const picked = pickByFile(req.file.originalname, req.file.size, list)
    const result: DiseaseDiagnosis = { ...picked, id: shortId('dx') }
    await db.collection('diagnoses').doc(result.id).set({
      kind: 'disease',
      imagePath: req.file.filename,
      resultRefId: picked.id,
      createdAt: new Date().toISOString(),
    })
    res.status(201).json(result)
  }),
)

diagnosisRouter.post(
  '/diagnose/pest',
  upload.single('photo'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Missing "photo" file field')
    const refs = await db.collection('pestReference').get()
    const list = refs.docs.map((d) => d.data() as PestDiagnosis)
    if (list.length === 0) throw new HttpError(500, 'No pest reference data seeded – run `npm run seed`')

    const picked = pickByFile(req.file.originalname, req.file.size, list)
    const result: PestDiagnosis = { ...picked, id: shortId('dx') }
    await db.collection('diagnoses').doc(result.id).set({
      kind: 'pest',
      imagePath: req.file.filename,
      resultRefId: picked.id,
      createdAt: new Date().toISOString(),
    })
    res.status(201).json(result)
  }),
)
