import { Hono } from 'hono'
import type { AppBindings } from '../types/env'
import {
  createIndividual,
  getIndividual,
  listIndividuals,
} from '../repositories/individuals'
import { createTeam, getTeam, listTeams } from '../repositories/teams'

const studentsRouter = new Hono<AppBindings>()

const PROJECT_FIELDS = [
  'مسابقة التنقل الذكي',
  'مسابقة ابتكار التكنولوجيا الحيوية',
  'مسابقة تقنيات البيئة والطاقة',
  'مسابقة تقنيات التعليم',
  'مسابقة تقنيات المعيشة الخالية من العوائق',
  'مسابقة أفكار التكنولوجيا المالية',
  'مسابقة التكنولوجيا لصالح البشرية',
  'مسابقة تطبيقات التكنولوجيا في علم النفس',
  'مسابقة الذكاء الاصطناعي في الصحة',
  'مسابقة التقنيات الصناعية',
  'مسابقة التكنولوجيا الزراعية',
  'مسابقة هاكاثون السفر',
  'مسابقة تقنيات السياحة',
  'مسابقة معالجة اللغة التركية',
  'مسابقة الذكاء الاصطناعي في النقل',
  'مسابقة تطبيقات نماذج اللغة الضخمة',
  'مسابقة تقنيات أنظمة الدفاع الجويّة',
]

studentsRouter.post('/team', async (c) => {
  const body = await c.req.json()
  const team = await createTeam(c.env, body)
  return c.json(team, 201)
})

studentsRouter.get('/teams', async (c) => {
  const teams = await listTeams(c.env)
  return c.json(teams)
})

studentsRouter.get('/team/:team_id', async (c) => {
  const teamId = Number(c.req.param('team_id'))
  const team = await getTeam(c.env, teamId)
  if (!team) return c.json({ message: 'Team not found' }, 404)
  return c.json(team)
})

studentsRouter.post('/individual', async (c) => {
  const body = await c.req.json()
  const individual = await createIndividual(c.env, body)
  return c.json(individual, 201)
})

studentsRouter.get('/individuals', async (c) => {
  const individuals = await listIndividuals(c.env)
  return c.json(individuals)
})

studentsRouter.get('/individual/:individual_id', async (c) => {
  const id = Number(c.req.param('individual_id'))
  const individual = await getIndividual(c.env, id)
  if (!individual) return c.json({ message: 'Individual not found' }, 404)
  return c.json(individual)
})

studentsRouter.get('/fields', (c) => c.json(PROJECT_FIELDS))

studentsRouter.get('/stats', async (c) => {
  const teams = await listTeams(c.env)
  const individuals = await listIndividuals(c.env)
  return c.json({
    teams_count: teams.length,
    individuals_count: individuals.length,
    assigned_individuals: individuals.filter((i) => i.is_assigned).length,
  })
})

export default studentsRouter
