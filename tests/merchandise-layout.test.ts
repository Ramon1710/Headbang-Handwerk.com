import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppRouterContext, type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { MerchandiseShop } from '@/components/merchandise-shop';
import { defaultCmsContent } from '@/lib/cms/default-content';
import { resolveLiveBoxStyle, sanitizeLiveEditorBoxStyle } from '@/lib/cms/live-editor';
import { calculateCartTotal, getCartItemKey, validateCheckoutCustomer } from '@/lib/merchandise';

const boxStyles = {
  'home.events.box': { width: '900px', height: '600px' },
  'merchandise.shop.box': { width: '720px', height: '400px', minHeight: '400px' },
  'merchandise.shop.box@mobile': { width: '340px', height: '200px', minHeight: '200px' },
};

function renderBox(options: { isAdmin?: boolean; growWithContent?: boolean; applySavedHeight?: boolean } = {}) {
  return renderToStaticMarkup(createElement(LiveResizableBox, {
    boxKey: 'merchandise.shop.box',
    className: 'shop-content',
    initialStyle: resolveLiveBoxStyle({ richText: {}, boxStyles }, 'merchandise.shop.box'),
    isAdmin: false,
    allowPosition: false,
    ...options,
    children: createElement('p', null, 'Shop content'),
  }));
}

test('Shop-Layout verwendet getrennte Desktop- und Mobile-Schluessel ohne andere Seiten zu aendern', () => {
  const saved = structuredClone(boxStyles);
  const next = {
    ...saved,
    'merchandise.shop.box': sanitizeLiveEditorBoxStyle({ width: '640px', height: '350px', minHeight: '350px' }),
  };
  assert.deepEqual(next['home.events.box'], boxStyles['home.events.box']);
  assert.deepEqual(next['merchandise.shop.box@mobile'], boxStyles['merchandise.shop.box@mobile']);
  assert.deepEqual(resolveLiveBoxStyle({ richText: {}, boxStyles: next }, 'merchandise.shop.box'), {
    desktop: { width: '640px', height: '350px', minHeight: '350px' },
    mobile: boxStyles['merchandise.shop.box@mobile'],
  });
});

test('Inhaltsbasierte Shophoehe bleibt automatisch und begrenzt die Breite auf den Elterncontainer', () => {
  const html = renderBox({ growWithContent: true });
  assert.match(html, /--live-box-width-desktop:720px/);
  assert.match(html, /--live-box-width-mobile:340px/);
  assert.match(html, /--live-box-min-height-desktop:400px/);
  assert.match(html, /--live-box-min-height-mobile:200px/);
  assert.match(html, /--live-box-height-desktop:auto/);
  assert.match(html, /--live-box-height-mobile:auto/);
  assert.match(html, /max-width:100%/);
  assert.match(html, /min-width:min\(100%, 20rem\)/);
  assert.match(html, /flex-1/);
  assert.doesNotMatch(html, /h-full/);
});

test('Nur der Admin sieht Resize-Griffe, andere Boxen behalten ihre bisherige Hoehensteuerung', () => {
  assert.doesNotMatch(renderBox({ growWithContent: true }), /aria-label="(Größe ändern|Breite und Höhe ändern)"/);
  const adminHtml = renderBox({ isAdmin: true, growWithContent: true });
  assert.match(adminHtml, /aria-label="Größe ändern"/);
  assert.match(adminHtml, /aria-label="Breite und Höhe ändern"/);
  assert.doesNotMatch(adminHtml, /Bewegen/);
  const fixedHtml = renderBox();
  assert.match(fixedHtml, /--live-box-height-desktop:400px/);
  assert.match(fixedHtml, /--live-box-height-mobile:200px/);
  assert.match(fixedHtml, /h-full/);
  assert.doesNotMatch(fixedHtml, /max-width:100%/);
  const autoHtml = renderBox({ isAdmin: true, applySavedHeight: false });
  assert.doesNotMatch(autoHtml, /--live-box-(min-)?height-(desktop|mobile):\d/);
  assert.doesNotMatch(autoHtml, /aria-label="Größe ändern"/);
});

test('Verschachtelte Textboxen erben keine Shopgroessen oder Positionswerte', () => {
  const html = renderToStaticMarkup(createElement(LiveResizableBox, {
    boxKey: 'merchandise.support.box',
    className: 'support',
    isAdmin: false,
    applySavedHeight: false,
    children: 'Support text',
  }));
  assert.match(html, /--live-box-width-desktop:auto/);
  assert.match(html, /--live-box-width-mobile:100%/);
  for (const viewport of ['desktop', 'mobile']) {
    assert.ok(html.includes(`--live-box-height-${viewport}:auto`));
    assert.ok(html.includes(`--live-box-min-height-${viewport}:auto`));
    assert.ok(html.includes(`--live-box-offset-x-${viewport}:0px`));
    assert.ok(html.includes(`--live-box-offset-y-${viewport}:0px`));
  }
});

test('Produktdaten und Shop-Steuerelemente bleiben erhalten und das Layout verwendet Container-Breakpoints', () => {
  const products = defaultCmsContent.site.merchandise.products;
  const before = structuredClone(products);
  const unexpectedNavigation = () => assert.fail('Static rendering must not navigate');
  const router: AppRouterInstance = {
    back: unexpectedNavigation, forward: unexpectedNavigation, refresh: unexpectedNavigation,
    push: unexpectedNavigation, replace: unexpectedNavigation, prefetch: unexpectedNavigation,
  };
  const html = renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: router }, createElement(MerchandiseShop, {
    products,
    isAdmin: false,
    liveEditor: { richText: {}, boxStyles: {} },
  })));
  assert.deepEqual(products, before);
  for (const product of products) {
    assert.ok(html.includes(product.name));
  }
  assert.match(html, /@container/);
  assert.match(html, /@min-\[48rem\]:grid-cols-3/);
  assert.doesNotMatch(html, /lg:grid-cols-3/);
  assert.match(html, /Zwischensumme/);
  assert.match(html, /In den Warenkorb/);
  assert.match(html, /Größe/);
  assert.match(html, /Anzahl/);
});

test('Warenkorbvarianten, Summen und Checkoutvalidierung bleiben unveraendert', () => {
  const products = defaultCmsContent.site.merchandise.products;
  const product = products[0];
  assert.ok(product);
  const item = { productId: product.id, quantity: 2, size: product.sizes?.[0], color: product.colors?.[0] };
  assert.equal(calculateCartTotal([item], products), product.price * 2);
  assert.notEqual(getCartItemKey(item), getCartItemKey({ ...item, size: 'test-other-size' }));
  assert.equal(validateCheckoutCustomer({
    firstName: 'Test', lastName: 'Kunde', street: 'Testweg', houseNumber: '1',
    postalCode: '12345', city: 'Testort', phone: '0123456789', email: 'test@example.com',
  }).valid, true);
});
