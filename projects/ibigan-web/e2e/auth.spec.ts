import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';
const TENANT_ID = 'empresa-teste-32uprx';
const EMAIL = 'admin@teste.com';
const PASSWORD = 'senha123';

test('redireciona para login ao acessar raiz', async ({ page }) => {
  await page.goto(BASE);
  await expect(page).toHaveURL(/auth\/login/);
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
});

test('exibe erros ao submeter login vazio', async ({ page }) => {
  await page.goto(`${BASE}/auth/login`);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('ID da organização é obrigatório.')).toBeVisible();
});

test('login com sucesso redireciona para dashboard', async ({ page }) => {
  await page.goto(`${BASE}/auth/login`);
  await page.getByLabel('ID da Organização').fill(TENANT_ID);
  await page.getByLabel('E-mail').fill(EMAIL);
  await page.getByLabel('Senha').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 8000 });
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
});

test('usuário autenticado é redirecionado ao tentar acessar login', async ({ page }) => {
  await page.goto(`${BASE}/auth/login`);
  await page.getByLabel('ID da Organização').fill(TENANT_ID);
  await page.getByLabel('E-mail').fill(EMAIL);
  await page.getByLabel('Senha').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 8000 });
  await page.goto(`${BASE}/auth/login`);
  await expect(page).toHaveURL(/dashboard/);
});

test('exibe tela de registro', async ({ page }) => {
  await page.goto(`${BASE}/auth/register`);
  await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();
});

test('exibe erros de validação ao submeter registro vazio', async ({ page }) => {
  await page.goto(`${BASE}/auth/register`);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByText(/pelo menos 2 caracteres/i).first()).toBeVisible();
});

test('registro com sucesso redireciona para dashboard', async ({ page }) => {
  const suffix = Date.now();
  await page.goto(`${BASE}/auth/register`);
  await page.getByLabel('Nome da empresa').fill(`Empresa ${suffix}`);
  await page.getByLabel('Seu nome').fill('Novo Admin');
  await page.getByLabel('E-mail').fill(`admin${suffix}@teste.com`);
  await page.getByLabel('Senha', { exact: true }).fill('senha123');
  await page.getByLabel('Confirmar senha').fill('senha123');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 8000 });
});

test('exibe tela de recuperação de senha', async ({ page }) => {
  await page.goto(`${BASE}/auth/forgot-password`);
  await expect(page.getByRole('heading', { name: 'Esqueceu a senha?' })).toBeVisible();
});

test('link Esqueceu a senha navega para forgot-password', async ({ page }) => {
  await page.goto(`${BASE}/auth/login`);
  await page.getByText('Esqueceu a senha?').click();
  await expect(page).toHaveURL(/forgot-password/);
});

test('forgot-password exibe confirmação após envio', async ({ page }) => {
  await page.goto(`${BASE}/auth/forgot-password`);
  await page.getByLabel('ID da Organização').fill(TENANT_ID);
  await page.getByLabel('E-mail').fill(EMAIL);
  await page.getByRole('button', { name: 'Enviar instruções' }).click();
  await expect(page.getByText(/E-mail enviado/)).toBeVisible({ timeout: 8000 });
});

test('link Criar conta navega para register', async ({ page }) => {
  await page.goto(`${BASE}/auth/login`);
  await page.getByText('Criar conta').click();
  await expect(page).toHaveURL(/register/);
});

test('link Voltar ao login no forgot-password navega para login', async ({ page }) => {
  await page.goto(`${BASE}/auth/forgot-password`);
  await page.getByText('Voltar ao login').click();
  await expect(page).toHaveURL(/login/);
});
