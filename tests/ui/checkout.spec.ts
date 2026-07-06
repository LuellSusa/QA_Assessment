import { test, expect } from '@playwright/test';


//Creds
const STANDARD_USER = 'standard_user';
const LOCKED_USER = 'locked_out_user';
const PASSWORD = 'secret_sauce';


//Happy path: standard user can log in, add items, and complete checkout
test.describe('Swag Labs checkout flow', () => {
  test('standard user can log in, add items, and complete checkout', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Username').fill(STANDARD_USER);
    await page.getByPlaceholder('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/inventory\.html/);

    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await page.locator('[data-test="add-to-cart-sauce-labs-bike-light"]').click();
    await expect(page.locator('.shopping_cart_badge')).toHaveText('2');

    await page.locator('.shopping_cart_link').click();
    await expect(page).toHaveURL(/cart\.html/);
    await expect(page.locator('.cart_item')).toHaveCount(2);

    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByPlaceholder('First Name').fill('Jane');
    await page.getByPlaceholder('Last Name').fill('Doe');
    await page.getByPlaceholder('Zip/Postal Code').fill('12345');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/checkout-step-two\.html/);
    await page.getByRole('button', { name: 'Finish' }).click();

    await expect(page).toHaveURL(/checkout-complete\.html/);
    await expect(page.locator('.complete-header')).toHaveText('Thank you for your order!');
  });


//Unhappy path: locked out user cannot log in, checkout blocks submission when required info is missing
  test('locked out user cannot log in (unhappy path)', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Username').fill(LOCKED_USER);
    await page.getByPlaceholder('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();

    // Should stay on the login page and show an error, not silently fail
    await expect(page).toHaveURL('https://www.saucedemo.com/');
    await expect(page.locator('[data-test="error"]')).toContainText('locked out');
  });

  test('checkout blocks submission when required info is missing (unhappy path)', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Username').fill(STANDARD_USER);
    await page.getByPlaceholder('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await page.locator('.shopping_cart_link').click();
    await page.getByRole('button', { name: 'Checkout' }).click();

    // Leave all fields blank and try to continue anyway
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/checkout-step-one\.html/);
    await expect(page.locator('[data-test="error"]')).toContainText('First Name is required');
  });
});
