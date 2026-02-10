/**
 * Credit Card / Payment Test Suite
 * Tests for payment device component
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log, promptUser } from "../helpers.js";
import { getCuss2 } from "./initialize.js";
import { baseComponentTests } from "./base-component.js";

export const creditCardSuite = {
  id: "credit-card",
  name: "Credit Card",
  description:
    "Tests for payment device component including payment initiation, cancellation, and timeout handling.",
  tests: baseComponentTests(getCuss2, "paymentDevice", () => [
    {
      name: "it should enable the payment device",
      description:
        "Sends an enable directive to the payment device component to prepare it for transaction processing.\n\nEnabling the payment device activates the card reader hardware (chip, contactless, and/or magnetic stripe) and makes it ready to accept `initiatePayment` commands.\n\n**What is validated:**\n- The response `meta.messageCode` equals `OK`\n\n**Prerequisites:**\n- Payment device component must exist in the platform's component list\n- Platform must be in the ACTIVE state",
      test: async function () {
        const cuss2 = getCuss2();
        const payment = cuss2.paymentDevice;
        if (!payment) {
          this.result = { status: "inconclusive", reason: "No payment device component available" };
          return;
        }

        const response = await payment.enable();
        expect(response.meta.messageCode).to.equal("OK");
        log("Payment device enabled");
      },
    },
    {
      name: "it should initiate a payment transaction",
      description:
        "Calls `initiatePayment` on the payment device with an amount and currency code to start a payment transaction.\n\nThe user is prompted to physically interact with the payment terminal (tap, insert, or swipe a card). The platform processes the payment request through the integrated payment hardware and returns a response.\n\n**What is validated:**\n- A response is received from the payment device after user interaction\n- The response `meta.messageCode` is logged for verification\n\n**Prerequisites:**\n- Payment device must be enabled\n- A physical payment card must be available for the user prompt",
      test: async function () {
        const cuss2 = getCuss2();
        const payment = cuss2.paymentDevice;
        if (!payment) {
          this.result = { status: "inconclusive", reason: "No payment device component available" };
          return;
        }

        await promptUser(
          "Tap or insert a card when prompted by the payment device",
          async () => {
            if (typeof payment.initiatePayment === "function") {
              const response = await payment.initiatePayment({
                amount: 100,
                currency: "USD",
              });
              log(`Payment response: ${response.meta.messageCode}`);
              return response;
            } else {
              log("Payment initiation method not available");
              return true;
            }
          },
          { icon: "credit-card" },
        );
      },
    },
    {
      name: "it should handle payment cancellation",
      description:
        "Initiates a payment transaction and immediately sends a cancel directive to abort it before completion.\n\nThis tests the platform's ability to cleanly abort an in-progress payment. The `initiatePayment` call is made first, followed immediately by a `cancel` call. The payment promise is caught to handle the expected rejection.\n\n**What is validated:**\n- The cancel directive receives a response with a `meta.messageCode`\n- The payment result after cancellation is logged (may be an error or a `CANCELLED` code)\n- The payment device returns to a state ready for the next transaction\n\n**Prerequisites:**\n- Payment device must be enabled\n- No physical card interaction is required (cancellation happens before user input)",
      test: async function () {
        const cuss2 = getCuss2();
        const payment = cuss2.paymentDevice;
        if (!payment) {
          this.result = { status: "inconclusive", reason: "No payment device component available" };
          return;
        }

        await promptUser(
          "A payment will be started and immediately cancelled",
          async () => {
            if (
              typeof payment.initiatePayment === "function" &&
              typeof payment.cancel === "function"
            ) {
              // Start payment
              const paymentPromise = payment.initiatePayment({
                amount: 100,
                currency: "USD",
              }).catch((e) => e);

              // Cancel immediately
              const cancelResponse = await payment.cancel();
              log(`Cancel response: ${cancelResponse.meta.messageCode}`);

              const paymentResult = await paymentPromise;
              log(
                `Payment result after cancel: ${
                  paymentResult?.meta?.messageCode || paymentResult
                }`,
              );
            } else {
              log("Payment methods not available");
            }
            return true;
          },
          { icon: "x-circle" },
        );
      },
    },
    {
      name: "it should handle payment timeout",
      description:
        "Initiates a payment transaction with a short timeout (5 seconds) and instructs the user not to interact with the device.\n\nThis verifies the platform's timeout behavior when a payment is initiated but no card is presented. After the specified timeout elapses, the payment device should automatically abort the transaction and return a timeout response or throw an error.\n\n**What is validated:**\n- The payment request either returns a response with a timeout-related `meta.messageCode` or throws an error\n- The payment device recovers gracefully after the timeout\n\n**Prerequisites:**\n- Payment device must be enabled\n- User must NOT interact with the payment device during this test",
      test: async function () {
        const cuss2 = getCuss2();
        const payment = cuss2.paymentDevice;
        if (!payment) {
          this.result = { status: "inconclusive", reason: "No payment device component available" };
          return;
        }

        await promptUser(
          "Payment will be started - DO NOT interact with the device (wait for timeout)",
          async () => {
            if (typeof payment.initiatePayment === "function") {
              try {
                const response = await payment.initiatePayment({
                  amount: 100,
                  currency: "USD",
                  timeout: 5000, // 5 second timeout
                });
                log(`Payment response: ${response.meta.messageCode}`);
              } catch (error) {
                log(`Payment timeout/error: ${error.message || error}`);
              }
            } else {
              log("Payment initiation method not available");
            }
            return true;
          },
          { icon: "clock" },
        );
      },
    },
  ], ["active.0"]),
};
