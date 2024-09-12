import { test, expect, Page } from '@playwright/test';
import { SELECTORS } from './constants';
import { typeFilter, teamFilter, sortAndVerifyDates } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Actions List', () => {

  test('Page Title', async ({ page }) => {
    await expect(page).toHaveTitle(/Home/);
  });

  test('New Action Button', async ({ page }) => {
    const newActionButton = page.locator(SELECTORS.newActionButton);
    await expect(newActionButton).toBeVisible();
    await expect(newActionButton).toBeDisabled();
  });

  // Test to verify the visibility and presence of elements in the actions list
  test('Actions List', async ({ page }) => {
    const actionsList = page.locator(SELECTORS.actionsList);
    await expect(actionsList).toBeVisible();

    const listItems = actionsList.locator('li');
    await expect(listItems).not.toHaveCount(0);

    await expect(page.getByRole('button', { name: 'Load More' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Filter by Domain' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sort Filter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Type Filter' })).toBeVisible();
  });

  // Test to verify individual items in the actions list
  test('Individual Item', async ({ page }) => {
    const listItems = page.locator(`${SELECTORS.actionsList} > li`);

    for (let i = 0; i < await listItems.count(); i++) {
      const listItem = listItems.nth(i);

      // Locate various elements within the list item
      const avatar = listItem.locator('img[class*="Avatar_image"]');
      const status = listItem.locator('span[class*="Tag"]');
      const day = listItem.locator('span[class*="ActionsListItem_day"]');
      const domain = listItem.locator('span[class*="ActionsListItem_domain"]');

      // Verify the visibility of the located elements
      await expect(avatar).toBeVisible();
      await expect(status).toBeVisible();
      await expect(day).toBeVisible();
      await expect(domain).toBeVisible();

      // Get the title and type of the list item
      const title = await listItem.locator('span[class*="ActionsListItem_title"]').innerText();
      const type = await listItem.getAttribute('data-action-type');

      // Verify the title format based on the type
      switch (type?.toUpperCase()) {
        case 'MINT':
          expect(title).toMatch(/Mint \d+ @?\w+/);
          break;
        case 'PAYMENT':
          expect(title).toMatch(/Pay @?\w+ \d+ \w+/);
          break;
        case 'TRANSFER':
          expect(title).toMatch(/Move \d+ @?\w+ from @?\w+ to @?\w+/);
          break;
        case 'REPUTATION':
          expect(title).toMatch(/Awarded @?\w+ with a \d+ points reputation award/);
          break;
        case 'PERMISSIONS':
          expect(title).toMatch(/Assign the @?[\w,]+ permissions in @?\w+ to @?\w+/);
          break;
        case 'UPGRADE':
          expect(title).toMatch(/Upgrade to version \d+/);
          break;
        case 'DETAILS':
          expect(title).toMatch(/Details changed/);
          break;
        case 'ADDRESS':
          expect(title).toMatch(/Address book was updated/);
          break;
        case 'TEAM':
          expect(title).toMatch(/New team: @?\w+/);
          break;
        case 'GENERIC':
          expect(title).toMatch(/Generic Action/);
          break;
        default:
          throw new Error(`Unknown type: ${type}`);
      }
    }
  });

  // Test to verify sorting by date
  test('Date Sort', async ({ page }) => {
    await sortAndVerifyDates(page, 0, 'desc'); // Sort by newest first
    await sortAndVerifyDates(page, 1, 'asc');  // Sort by oldest first
  });

  // Test to verify filtering by type
  test('Type Filter', async ({ page }) => {
    await typeFilter(page);
  });

  // Test to verify filtering by team
  test('Team Filter', async ({ page }) => {
    await teamFilter(page);
  });

  // Test to verify type filter, team filter, and date sort functionality
  test('Type Filter + Team Filter + Date Sort', async ({ page }) => {
    await typeFilter(page); // Apply type filter
    await teamFilter(page); // Apply team filter
    await sortAndVerifyDates(page, 0, 'desc'); // Sort by newest first
    await sortAndVerifyDates(page, 1, 'asc'); // Sort by oldest first
  });

  // Test to verify the loader component's success state
  test('Loader Component Success', async ({ page }) => {
    // Reload the page
    page.reload();

    // Locate the loader and actions list elements
    const loader = page.locator(SELECTORS.spinnerLoader);
    const actionsList = page.locator(SELECTORS.actionsList);

    // Verify either loader or actions list is visible
    await expect(loader.or(actionsList)).toBeVisible();

    // Wait for the loader to be hidden
    await loader.waitFor({ state: 'hidden', timeout: 10000 });

    // Verify the loader is not visible
    await expect(loader).not.toBeVisible();
  });

  // Test to verify the "Load More" button functionality
  test('Load More Button', async ({ page }) => {
    // Locate the "Load More" button
    const loadMoreButton = page.locator(SELECTORS.loadMoreButton);

    // Click the "Load More" button until it is no longer visible
    while (await loadMoreButton.isVisible()) {
      // Get the current count of list items
      const prevItemsCount = await page.locator(`${SELECTORS.actionsList} > li`).count();

      // Click the "Load More" button
      await loadMoreButton.click();

      // Get the new count of list items
      const listItems = page.locator(`${SELECTORS.actionsList} > li`);
      const itemCount = await listItems.count();

      // Verify the item count has increased
      expect(itemCount).toBeGreaterThan(prevItemsCount);
    }

    // Verify the "Load More" button is not visible
    await expect(loadMoreButton).not.toBeVisible();
  });

  // Test to verify the visibility of the user popover component
  test('User Popover Component', async ({ page }) => {
    const avatars = page.locator(SELECTORS.avatarImage);
    const avatar = avatars.first();

    // Click the first avatar
    await avatar.click();

    const popover = page.locator(SELECTORS.infoPopover);

    // Verify the popover is visible
    await expect(popover).toBeVisible();

    // Click the avatar again
    await avatar.click();

    // Verify the popover is not visible
    await expect(popover).not.toBeVisible();
  });

  // Test to verify the information displayed in the user popover
  test('User Popover Information', async ({ page }) => {
    const avatars = page.locator(SELECTORS.avatarImage);
    const avatar = avatars.first();

    // Click the first avatar
    await avatar.click();

    const popover = page.locator(SELECTORS.infoPopover);

    // Verify the popover is visible
    await expect(popover).toBeVisible();

    // Locate elements within the popover
    const popoverAvatar = popover.locator('figure[class*="Avatar"]');
    const popoverName = popover.locator(SELECTORS.popoverName);
    const popoverAddress = popover.locator(SELECTORS.popoverAddress);

    // Get user information from the popover
    const infoContainer = popoverName.locator('span[class*="UserMention_mention"]');
    const username = await infoContainer.getAttribute('data-username');
    const walletAddress = await infoContainer.getAttribute('data-user-walletaddress');

    // Verify the visibility of the located elements
    await expect(popoverAvatar).toBeVisible();
    await expect(popoverName).toBeVisible();
    await expect(popoverAddress).toBeVisible();

    // Verify the avatar image source matches
    const avatarSrc = await avatar.getAttribute('src');
    const popoverAvatarSrc = await popoverAvatar.locator('img').getAttribute('src');
    expect(avatarSrc).toBe(popoverAvatarSrc);

    // Verify the username matches
    const name = await popoverName.innerText();
    expect(name).toBe(`@${username}`);

    // Verify the wallet address matches
    const address = await popoverAddress.innerText();
    expect(address).toBe(walletAddress);
  });

  // Test to verify the styling of the user avatar in the popover
  test('User Avatar Styling', async ({ page }) => {
    const avatars = page.locator(SELECTORS.avatarImage);
    const avatar = avatars.first();

    // Click the first avatar
    await avatar.click();

    const popover = page.locator(SELECTORS.infoPopover);

    // Verify the popover is visible
    await expect(popover).toBeVisible();

    // Locate the avatar in the popover
    const popoverAvatar = popover.locator(SELECTORS.popoverAvatar);

    // Verify the avatar's CSS properties
    await expect(popoverAvatar).toHaveCSS('width', '42px');
    await expect(popoverAvatar).toHaveCSS('height', '42px');

    // Verify the avatar image source matches
    const avatarImageSrc = await avatar.getAttribute('src');
    const popoverImageSrc = await popoverAvatar.getAttribute('src');
    expect(avatarImageSrc).toBe(popoverImageSrc);
  });

  // Test to verify the styling of the user name in the popover
  test('User Name Styling', async ({ page }) => {
    const avatars = page.locator(SELECTORS.avatarImage);
    const avatar = avatars.first();

    // Click the first avatar
    await avatar.click();

    const popover = page.locator(SELECTORS.infoPopover);

    // Verify the popover is visible
    await expect(popover).toBeVisible();

    // Locate the user name in the popover
    const popoverName = popover.locator(SELECTORS.popoverName);

    // Verify the user name's CSS properties
    await expect(popoverName).toHaveCSS('font-weight', '700');
    await expect(popoverName).toHaveCSS('font-size', '13px');
    await expect(popoverName).toHaveCSS('color', 'rgb(254, 94, 124)');
  });
});