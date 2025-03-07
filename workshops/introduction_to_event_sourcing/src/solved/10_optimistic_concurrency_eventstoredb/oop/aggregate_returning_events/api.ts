import { type Request, type Response, Router } from 'express';
import { sendCreated } from '../../tools/api';
import {
  HeaderNames,
  getETagFromIfMatch,
  getWeakETagValue,
  toWeakETag,
} from '../../tools/etag';
import {
  assertNotEmptyString,
  assertPositiveNumber,
  assertUnsignedBigInt,
} from '../../tools/validation';
import { ShoppingCartService } from './applicationService';
import { type PricedProductItem, type ProductItem } from './shoppingCart';

export const getExpectedRevision = (request: Request): bigint => {
  const eTag = getETagFromIfMatch(request);
  const weakEtag = getWeakETagValue(eTag);

  return assertUnsignedBigInt(weakEtag);
};

export const setNextExpectedRevision = (
  response: Response,
  nextEspectedRevision: bigint,
): void => {
  response.set(HeaderNames.ETag, toWeakETag(nextEspectedRevision));
};

export const mapShoppingCartStreamId = (id: string) => `shopping_cart-${id}`;

const dummyPriceProvider = (_productId: string) => {
  return 100;
};

export const shoppingCartApi =
  (shoppingCartService: ShoppingCartService) => (router: Router) => {
    // Open Shopping cart
    router.post(
      '/clients/:clientId/shopping-carts/',
      async (request: Request, response: Response) => {
        const clientId = assertNotEmptyString(request.params.clientId);
        // We're using here clientId as a shopping cart id (instead a random uuid) to make it unique per client.
        // What potential issue do you see in that?
        const shoppingCartId = clientId;

        const nextExpectedRevision = await shoppingCartService.open(
          {
            type: 'OpenShoppingCart',
            data: {
              shoppingCartId,
              clientId,
              now: new Date(),
            },
          },
          { expectedRevision: -1n },
        );

        setNextExpectedRevision(response, nextExpectedRevision);
        sendCreated(response, shoppingCartId);
      },
    );

    router.post(
      '/clients/:clientId/shopping-carts/:shoppingCartId/product-items',
      async (request: AddProductItemRequest, response: Response) => {
        const shoppingCartId = assertNotEmptyString(
          request.params.shoppingCartId,
        );
        const productItem: ProductItem = {
          productId: assertNotEmptyString(request.body.productId),
          quantity: assertPositiveNumber(request.body.quantity),
        };
        const unitPrice = dummyPriceProvider(productItem.productId);

        const nextExpectedRevision = await shoppingCartService.addProductItem(
          {
            type: 'AddProductItemToShoppingCart',
            data: {
              shoppingCartId,
              productItem: {
                ...productItem,
                unitPrice,
              },
            },
          },
          { expectedRevision: getExpectedRevision(request) },
        );

        setNextExpectedRevision(response, nextExpectedRevision);
        response.sendStatus(204);
      },
    );

    // Remove Product Item
    router.delete(
      '/clients/:clientId/shopping-carts/:shoppingCartId/product-items',
      async (request: Request, response: Response) => {
        const shoppingCartId = assertNotEmptyString(
          request.params.shoppingCartId,
        );
        const productItem: PricedProductItem = {
          productId: assertNotEmptyString(request.query.productId),
          quantity: assertPositiveNumber(Number(request.query.quantity)),
          unitPrice: assertPositiveNumber(Number(request.query.unitPrice)),
        };

        const nextExpectedRevision =
          await shoppingCartService.removeProductItem(
            {
              type: 'RemoveProductItemFromShoppingCart',
              data: {
                shoppingCartId,
                productItem,
              },
            },
            { expectedRevision: getExpectedRevision(request) },
          );

        setNextExpectedRevision(response, nextExpectedRevision);
        response.sendStatus(204);
      },
    );

    // Confirm Shopping Cart
    router.post(
      '/clients/:clientId/shopping-carts/:shoppingCartId/confirm',
      async (request: Request, response: Response) => {
        const shoppingCartId = assertNotEmptyString(
          request.params.shoppingCartId,
        );

        const nextExpectedRevision = await shoppingCartService.confirm(
          {
            type: 'ConfirmShoppingCart',
            data: { shoppingCartId, now: new Date() },
          },
          { expectedRevision: getExpectedRevision(request) },
        );

        setNextExpectedRevision(response, nextExpectedRevision);
        response.sendStatus(204);
      },
    );

    // Cancel Shopping Cart
    router.delete(
      '/clients/:clientId/shopping-carts/:shoppingCartId',
      async (request: Request, response: Response) => {
        const shoppingCartId = assertNotEmptyString(
          request.params.shoppingCartId,
        );

        const nextExpectedRevision = await shoppingCartService.cancel(
          {
            type: 'CancelShoppingCart',
            data: { shoppingCartId, now: new Date() },
          },
          { expectedRevision: getExpectedRevision(request) },
        );

        setNextExpectedRevision(response, nextExpectedRevision);
        response.sendStatus(204);
      },
    );
  };

// Add Product Item
type AddProductItemRequest = Request<
  Partial<{ shoppingCartId: string }>,
  unknown,
  Partial<{ productId: number; quantity: number }>
>;
