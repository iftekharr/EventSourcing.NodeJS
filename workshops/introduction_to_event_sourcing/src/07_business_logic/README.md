# Exercise 07 - Business Logic

Having the following shopping cart process:

1. The customer may add a product to the shopping cart only after opening it.
2. When selecting and adding a product to the basket customer needs to provide the quantity chosen. The product price is calculated by the system based on the current price list.
3. The customer may remove a product with a given price from the cart.
4. The customer can confirm the shopping cart and start the order fulfilment process.
5. The customer may also cancel the shopping cart and reject all selected products.
6. After shopping cart confirmation or cancellation, the product can no longer be added or removed from the cart.

Write the code that fulfils this logic. You can choose your prefered way to solve it, e.g.the Aggregate pattern, service, just pure functions or another way.Remember that in Event Sourcing each business operation has to result with a new business fact (so event). Use events and entities defined in previous exercises and new commands defined in `businessLogic.ts` file.

![events](./assets/events.jpg)

There are two variations:

- using mutable entities: [./oop/businessLogic.exercise.test.ts](./oop/businessLogic.exercise.test.ts),
- using fully immutable structures: [./immutable/businessLogic.exercise.test.ts](./immutable/businessLogic.exercise.test.ts),

Select your preferred approach (or both) to solve this use case.

_**Note**: If needed update entities, events or test setup structure_
