import { test, expect } from '@playwright/test';
const draftKey = 'hunchlane.preview.idea-draft.v2';
async function begin(page: import('@playwright/test').Page) {
  await page.goto('/dev/idea-preview');
  await page.getByRole('textbox', {
    name: 'Tell us what you have in mind.'
  }).fill('A meal kit for people cooking for one');
  await page.getByRole('button', {
    name: 'Explore my idea',
    exact: true
  }).click();
  await page.getByRole('radio', {
    name: 'Physical product'
  }).check();
}
test('a conversational intake preserves accepted answers and review across reload without research', async ({
  page
}) => {
  const paid: string[] = [];
  page.on('request', r => {
    if (r.method() === 'POST' && r.url().includes('/api/')) paid.push(r.url());
  });
  await page.goto('/');
  const realDraft={idea:'A neighbourhood repair service for household items',category:'service',audience:'Neighbours',location:'',answers:{}};
  await page.evaluate(value=>localStorage.setItem('hunchlane.idea-draft.v1',JSON.stringify(value)),realDraft);
  await begin(page);
  await page.getByRole('button', {
    name: 'Begin conversation'
  }).click();
  await expect(page.getByRole('button', {
    name: 'People living on their own',
    exact: true
  })).toBeVisible();
  await page.screenshot({
    path: `artifacts/idea-question-${test.info().project.name}.png`,
    fullPage: true
  });
  await page.getByRole('button', {
    name: 'People living on their own',
    exact: true
  }).click();
  await expect(page.getByRole('region', {name:'Idea conversation'}).getByText('How would someone get it?', {
    exact: false
  })).toBeVisible();
  await page.getByRole('textbox', {
    name: 'Your answer'
  }).fill('Delivered each week, with reusable packaging');
  await page.reload();
  await expect(page.getByRole('textbox', {
    name: 'Your answer'
  })).toHaveValue('Delivered each week, with reusable packaging');
  await page.getByRole('button', {
    name: 'Send answer'
  }).click();
  const brief = page.getByRole('region', {
    name: 'Research brief'
  });
  await expect(brief).toContainText('Delivered each week');
  await expect(brief.getByRole('heading',{name:'Your research brief'})).toBeFocused();
  await expect(brief).toContainText('People living on their own');
  await expect(brief).not.toContainText('Busy students');
  await page.reload();
  await expect(brief).toBeVisible();
  await page.getByRole('button', {
    name: 'Edit idea'
  }).click();
  await page.getByRole('textbox', {
    name: 'Tell us what you have in mind.'
  }).fill('A meal kit with reusable packaging for people cooking for one');
  await page.getByRole('button', {
    name: 'Save idea',
    exact: true
  }).click();
  await expect(brief).toContainText('reusable packaging');
  await page.screenshot({
    path: `artifacts/idea-review-${test.info().project.name}.png`,
    fullPage: true
  });
  expect(paid).toEqual([]);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('hunchlane.idea-draft.v1')!))).toEqual(realDraft);
  expect(await page.evaluate(()=>localStorage.getItem('hunchlane.idea-draft.v2'))).toBeNull();
  await page.setViewportSize({
    width: 320,
    height: 800
  });
  await page.emulateMedia({
    reducedMotion: 'reduce'
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Tab');
  await page.getByRole('button', {
    name: 'Start research',
    exact: true
  }).focus();
  expect(await page.getByRole('button', {
    name: 'Start research',
    exact: true
  }).evaluate(e => getComputedStyle(e).outlineStyle)).not.toBe('none');
});
test('intake sends once, exposes only honest pending work, and never retries an uncertain reply on reload', async ({
  page
}) => {
  await begin(page);
  let count = 0;
  await page.route('**/dev/idea-preview/intake', async route => {
    count++;
    await new Promise(r => setTimeout(r, 300));
    await route.abort();
  });
  await page.getByRole('button', {
    name: 'Begin conversation'
  }).evaluate((b: HTMLButtonElement) => {
    b.click();
    b.click();
  });
  await expect(page.getByRole('status')).toContainText('Preparing preview question');
  await expect(page.locator('main').getByRole('alert')).toContainText('couldn’t confirm');
  expect(count).toBe(1);
  await page.reload();
  await expect(page.getByRole('button', {
    name: 'Check saved reply'
  })).toBeVisible();
  expect(count).toBe(1);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).pending, draftKey)).toBe('intake');
});
test('research requires explicit submission and preserves uncertain request identity without replay', async ({
  page
}) => {
  await begin(page);
  await page.getByRole('button', {
    name: 'Review with what I have'
  }).click();
  let count = 0;
  await page.route('**/dev/idea-preview/research', async route => {
    count++;
    await route.fulfill({
      status: 202,
      json: {
        id: 'bad-response-id'
      }
    });
  });
  await page.getByRole('button', {
    name: 'Start research',
    exact: true
  }).evaluate((b: HTMLButtonElement) => {
    b.click();
    b.click();
  });
  await expect(page.locator('main').getByRole('alert')).toContainText('confirm whether research started');
  expect(count).toBe(1);
  const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).requestId, draftKey);
  await page.reload();
  await expect(page.getByRole('link', {
    name: 'Check research progress'
  })).toHaveAttribute('href', `/research/${before}`);
  expect(count).toBe(1);
});
test('new drafts recover validation and storage failures and show the signed-out return route', async ({
  page
}) => {
  await page.goto('/new');
  await page.getByRole('textbox', {
    name: 'Tell us what you have in mind.'
  }).fill('short');
  await page.getByRole('button', {
    name: 'Explore my idea',
    exact: true
  }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('at least 20');
  await expect(page.getByRole('textbox')).toBeFocused();
  await page.getByRole('textbox').fill('A local service that repairs broken household items');
  await page.getByRole('button', {
    name: 'Explore my idea',
    exact: true
  }).click();
  await page.getByRole('button', {
    name: 'Begin conversation'
  }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('Sign-in is being connected');
  await page.reload();
  await expect(page.getByRole('region', {
    name: 'Idea conversation'
  })).toContainText('household');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw Error('Blocked');
    };
  });
  await page.getByRole('textbox', {
    name: 'Your answer'
  }).fill('Neighbours');
  await expect(page.locator('main').getByRole('alert')).toContainText('could not save');
});
test('actual progress polls saved stages and retains them after a connection failure', async ({
  page
}) => {
  let polls = 0;
  await page.route('**/dev/research-preview/state', async route => {
    polls++;
    if (polls > 2) {
      await route.fulfill({
        status: 503,
        json: {
          error: 'Connection interrupted'
        }
      });
      return;
    }
    await route.fulfill({
      json: {
        id: '00000000-0000-4000-8000-000000000004',
        brief: {
          idea: 'A meal kit for people cooking for one'
        },
        stage: 'composing',
        status: 'running',
        dispatched: true,
        report: null
      }
    });
  });
  await page.goto('/dev/research-preview');
  await expect(page.getByRole('status')).toContainText('Finding a useful next step');
  await expect(page.locator('main').getByRole('alert')).toContainText('last saved stage');
  await expect(page.getByRole('list', {
    name: 'Updates observed in this visit'
  })).not.toContainText('Looking for what exists');
  await page.screenshot({
    path: `artifacts/idea-research-${test.info().project.name}.png`,
    fullPage: true
  });
});
