/**
 * Tests de integración de los endpoints principales de la API.
 * Usa supertest para simular peticiones HTTP.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';

import { getDb } from '../src/db/client';
import { createSchema } from '../src/db/schema';
import { insertSeedData } from '../src/db/seed';

// Importar rutas
import departmentsRouter from '../src/routes/departments';
import diseasesRouter from '../src/routes/diseases';
import mapRouter from '../src/routes/map';
import rankingsRouter from '../src/routes/rankings';
import alertsRouter from '../src/routes/alerts';
import metaRouter from '../src/routes/meta';

// Configurar app de test
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/departments', departmentsRouter);
app.use('/api/diseases', diseasesRouter);
app.use('/api/map', mapRouter);
app.use('/api/rankings', rankingsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/meta', metaRouter);

// Inicializar DB antes de los tests
beforeAll(() => {
  const db = getDb();
  createSchema(db);
  insertSeedData(db);
});

describe('API Endpoints', () => {
  describe('GET /api/departments', () => {
    it('debe retornar 25 departamentos', async () => {
      const res = await request(app).get('/api/departments');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(25);
    });

    it('debe incluir ubigeo, nombre y población', async () => {
      const res = await request(app).get('/api/departments');
      const first = res.body.data[0];
      expect(first).toHaveProperty('ubigeo');
      expect(first).toHaveProperty('nombre');
      expect(first).toHaveProperty('poblacion');
    });
  });

  describe('GET /api/diseases', () => {
    it('debe retornar enfermedades del catálogo', async () => {
      const res = await request(app).get('/api/diseases');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(8);
    });

    it('debe incluir código, nombre, categoría y prevención', async () => {
      const res = await request(app).get('/api/diseases');
      const dengue = res.body.data.find((d: { codigo: string }) => d.codigo === 'DENGUE');
      expect(dengue).toBeDefined();
      expect(dengue).toHaveProperty('categoria');
      expect(dengue).toHaveProperty('prevencion');
      expect(dengue).toHaveProperty('fuente_url');
    });
  });

  describe('GET /api/map', () => {
    it('debe retornar datos para los 25 departamentos', async () => {
      const res = await request(app).get('/api/map?year=2025&month=6');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(25);
    });

    it('debe incluir nivel de alerta y color', async () => {
      const res = await request(app).get('/api/map?year=2025&month=6');
      const first = res.body.data[0];
      expect(first).toHaveProperty('nivel_alerta');
      expect(first).toHaveProperty('color');
      expect(first).toHaveProperty('casos');
      expect(first).toHaveProperty('ubigeo');
    });

    it('debe filtrar por enfermedad específica', async () => {
      const res = await request(app).get('/api/map?year=2025&month=6&disease=DENGUE');
      expect(res.status).toBe(200);
      expect(res.body.filtro_enfermedad).toBe('DENGUE');
    });

    it('debe validar parámetros inválidos', async () => {
      const res = await request(app).get('/api/map?year=invalid');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/departments/:ubigeo/summary', () => {
    it('debe retornar el resumen de un departamento', async () => {
      const res = await request(app).get('/api/departments/16/summary?year=2025&month=6');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.departamento.nombre).toBeTruthy();
      expect(res.body.data.enfermedades).toBeDefined();
    });

    it('debe retornar 400 para ubigeo inválido', async () => {
      const res = await request(app).get('/api/departments/99/summary');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/rankings', () => {
    it('debe retornar top departamentos y enfermedades', async () => {
      const res = await request(app).get('/api/rankings?year=2025&month=6');
      expect(res.status).toBe(200);
      expect(res.body.data.top_departamentos).toBeDefined();
      expect(res.body.data.top_enfermedades).toBeDefined();
      expect(res.body.data.top_departamentos.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/alerts', () => {
    it('debe retornar alertas activas', async () => {
      const res = await request(app).get('/api/alerts?year=2025&month=6');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/meta/freshness', () => {
    it('debe retornar información de frescura de datos', async () => {
      const res = await request(app).get('/api/meta/freshness');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('fuentes');
      expect(res.body.data).toHaveProperty('semana_epidemiologica');
    });
  });
});
