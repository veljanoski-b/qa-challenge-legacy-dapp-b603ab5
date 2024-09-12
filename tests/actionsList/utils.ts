import { Page, expect } from "@playwright/test";
import { SELECTORS } from "./constants";

/**
 * Filters items on a page based on the selected option from a dropdown.
 * 
 * @param {Page} page - The Playwright page object.
 * @param {string} filterButtonName - The name of the filter button.
 * @param {string} dropdownLocator - The locator for the dropdown element.
 * @param {string} optionLocator - The locator for the options within the dropdown.
 * @param {string} listItemLocator - The locator for the list items to be filtered.
 * @param {string} listItemAttribute - The attribute of the list items to be compared with the option value.
 * @returns {Promise<void>}
 */
const filter = async (
  page: Page,
  filterButtonName: string,
  dropdownLocator: string,
  optionLocator: string,
  listItemLocator: string,
  listItemAttribute: string
): Promise<void> => {
  // Locate the filter button by its role and name, then click it
  const filterButton = page.getByRole('button', { name: filterButtonName });
  await filterButton.click();

  // Locate the dropdown and ensure it is visible
  const dropdown = page.locator(dropdownLocator);
  expect(dropdown).toBeVisible();

  // Locate all options within the dropdown
  const options = dropdown.locator(optionLocator);
  const optionsArray = await options.all();

  // Iterate over each option and perform filtering
  const promises = optionsArray.map(async (_, index) => {
    const option = dropdown.locator(`${optionLocator}[id$="-entry-${index}"]`);
    const optionValue = await option.getAttribute('title');

    // Locate all list items and check if they match the option value
    const listItems = page.locator(listItemLocator);
    const listItemsArray = await listItems.all();
    const allItemsMatch = listItemsArray.every(async (item) => await item.getAttribute(listItemAttribute) === optionValue);
    expect(allItemsMatch).toBeTruthy();

    // Click the filter button again to reset the filter
    await filterButton.click();
  });

  // Wait for all filtering operations to complete
  await Promise.all(promises);
};

/**
 * Applies the "Type Filter" on the page.
 * 
 * @param {Page} page - The Playwright page object.
 * @returns {Promise<void>}
 */
export const typeFilter = async (page: Page): Promise<void> =>
  await filter(
    page,
    'Type Filter',
    'ul[role="listbox"][id^="select-listbox-"]',
    'li[role="option"]',
    `${SELECTORS.actionsList} > li`,
    'data-action-type'
  );

/**
 * Applies the "Filter by Domain" on the page.
 * 
 * @param {Page} page - The Playwright page object.
 * @returns {Promise<void>}
 */
export const teamFilter = async (page: Page): Promise<void> =>
  await filter(
    page,
    'Filter by Domain',
    'ul[role="listbox"][id^="select-listbox-"]',
    'li[role="option"]',
    `${SELECTORS.actionsList} > li`,
    'span[class*="ActionsListItem_domain"]'
  );


/**
 * Sorts and verifies the dates in the actions list.
 * 
 * @param {Page} page - The Playwright page object.
 * @param {number} sortOptionIndex - The index of the sort option in the dropdown.
 * @param {'asc' | 'desc'} sortOrder - The order to sort the dates ('asc' for ascending, 'desc' for descending).
 * @returns {Promise<void>}
 */
export const sortAndVerifyDates = async (page: Page, sortOptionIndex: number, sortOrder: 'asc' | 'desc'): Promise<void> => {
  await page.locator(SELECTORS.sortFilterButton).click();

  const dropdown = page.locator('ul[role="listbox"][id^="select-listbox-"]');
  await expect(dropdown).toBeVisible();

  const dateSortOption = dropdown.locator(`[role="option"][id="sortFilter-listbox-entry-${sortOptionIndex}"]`);
  await dateSortOption.click();

  await expect(dropdown).not.toBeVisible();

  const listItems = page.locator(`${SELECTORS.actionsList} > li`);
  const listItemsArray = await listItems.all();
  const dates = await Promise.all(listItemsArray.map(async (item) => item.locator('span[class*="ActionsListItem_day"]').innerText()));
  const sortedDates = [...dates].sort((a, b) => sortOrder === 'desc' ? new Date(b).getTime() - new Date(a).getTime() : new Date(a).getTime() - new Date(b).getTime());
  expect(dates).toEqual(sortedDates);
};
