import { HttpResponse } from 'msw'
import { API_PATHS } from '@/api/paths'
import { db } from '../db/store'
import { api } from '../respond'
import { getScenario } from '../scenarios'

export const healthHandlers = [
  api.get(API_PATHS.health, () =>
    HttpResponse.json({ status: 'ok', scenario: getScenario(), seed: db.get().seed }),
  ),
]
