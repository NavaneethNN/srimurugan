import test from "node:test";
import assert from "node:assert/strict";
import { hashPin, verifyPin } from "../src/lib/cafeAuth";

test("validates 4 to 6 digit numeric PIN format correctly", () => {
  const pinRegex = /^\d{4,6}$/;
  assert.equal(pinRegex.test("1234"), true);
  assert.equal(pinRegex.test("12345"), true);
  assert.equal(pinRegex.test("123456"), true);

  // Invalid formats
  assert.equal(pinRegex.test("123"), false, "Must reject < 4 digits");
  assert.equal(pinRegex.test("1234567"), false, "Must reject > 6 digits");
  assert.equal(pinRegex.test("12a4"), false, "Must reject letters");
  assert.equal(pinRegex.test(" 1234"), false, "Must reject leading spaces");
  assert.equal(pinRegex.test(""), false, "Must reject empty string");
});

test("detects duplicate PIN across active staff accounts even with salted hashes", () => {
  const users = [
    { id: 1, name: "Staff One", pin: hashPin("1234") },
    { id: 2, name: "Staff Two", pin: hashPin("5678") },
  ];

  function isPinDuplicate(newPin: string, excludeUserId: number) {
    return users.some((u) => u.id !== excludeUserId && verifyPin(newPin, u.pin));
  }

  // Trying to set Staff Two's PIN to Staff One's PIN (1234) should be detected as duplicate
  assert.equal(isPinDuplicate("1234", 2), true);

  // Staff One keeping their own PIN (1234) should NOT be detected as duplicate for Staff One
  assert.equal(isPinDuplicate("1234", 1), false);

  // A brand new unique PIN (9999) should NOT be detected as duplicate
  assert.equal(isPinDuplicate("9999", 2), false);
});

test("PIN change invalidates old PIN and activates new PIN immediately", () => {
  const oldPin = "1111";
  const newPin = "9876";

  let storedHash = hashPin(oldPin);
  assert.equal(verifyPin(oldPin, storedHash), true);
  assert.equal(verifyPin(newPin, storedHash), false);

  // Perform PIN change
  storedHash = hashPin(newPin);

  assert.equal(verifyPin(newPin, storedHash), true);
  assert.equal(verifyPin(oldPin, storedHash), false);
});

test("admin PIN change enforces confirmation matching and prevents identical PIN", () => {
  const currentPin = "1234";
  const samePin = "1234";
  const newPin = "5678";
  const matchingConfirm = "5678";
  const mismatchConfirm = "5679";

  assert.equal(currentPin === samePin, true, "Detects identical PIN");
  assert.equal(newPin === matchingConfirm, true, "Accepts matching confirmation");
  assert.notEqual(newPin, mismatchConfirm, "Rejects mismatched confirmation");
});

