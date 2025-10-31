import { expect, test } from '@playwright/test';

test('Page should work', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('hello world')).toBeVisible();
});
