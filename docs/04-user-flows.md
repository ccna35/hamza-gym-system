# User Flows

## Flow 1 — Register Member Without Subscription

1. Owner opens Members.
2. Owner selects Add Member.
3. Owner enters required profile data.
4. Owner captures photo using webcam.
5. System validates unique phone number.
6. Owner saves.
7. Member is created with no subscription.
8. Owner may subscribe the member later.

## Flow 2 — Register Member and Subscribe Immediately

1. Create member.
2. Open/create subscription.
3. Select enabled plan.
4. Select 1, 3, 6, or 12 months.
5. Choose start date.
6. System loads listed price for selected plan/duration.
7. Owner may change final agreed price.
8. System calculates end date.
9. Owner optionally enters amount paid now.
10. System verifies payment does not exceed resulting member balance.
11. Save subscription and optional payment atomically.
12. If payment exists, generate receipt.

## Flow 3 — Renew Before Expiration

1. Owner opens member profile.
2. Select Renew Subscription.
3. System detects current/latest non-voided subscription.
4. New start date is set to the day after current end date.
5. Owner chooses any enabled plan.
6. Owner chooses supported duration.
7. Owner confirms or overrides agreed price.
8. Owner optionally records cash payment.
9. System ensures no overlapping subscription exists.
10. Save renewal.

## Flow 4 — Renew After Expiration

1. Owner opens expired member.
2. Select Renew Subscription.
3. Owner selects enabled plan and duration.
4. Owner chooses start date.
5. Owner chooses agreed price.
6. Owner optionally records payment.
7. System validates no overlap.
8. Save.

## Flow 5 — Record Debt Payment

1. Owner opens member.
2. System shows outstanding balance.
3. Owner selects Record Payment.
4. Enter amount and payment date.
5. System rejects amount <= 0.
6. System rejects amount greater than current debt.
7. Save payment.
8. System recalculates balance.
9. Generate receipt.

## Flow 6 — Void Incorrect Payment

1. Owner opens payment history.
2. Select payment.
3. Choose Void.
4. Owner enters reason.
5. System marks payment voided.
6. Payment remains visible.
7. Payment no longer counts toward revenue or debt reduction.
8. Receipt verification now shows voided status.
9. Audit event is created.
10. Owner may create a replacement payment.

## Flow 7 — Verify Receipt

1. QR code is scanned or verification token is entered.
2. Public verification endpoint looks up token.
3. System shows receipt number, member name, amount, payment date, and status.
4. If payment is valid, show Verified/Valid.
5. If payment is voided, show Voided/Invalid.
6. Unknown token returns Not Found/Invalid.

## Flow 8 — Edit Subscription

1. Owner opens subscription.
2. Owner edits allowed fields.
3. System validates dates, duration, non-overlap, and financial consistency.
4. Save changes.
5. Audit log stores before/after values.

## Flow 9 — Void Mistaken Subscription

1. Owner opens mistakenly-created subscription.
2. Select Void.
3. Enter reason.
4. Subscription is excluded from active/expired scheduling and debt calculations.
5. Historical record remains.
6. Audit event is created.

Note: this is not business cancellation. Cancellation remains out of scope.

## Flow 10 — Archive Member

1. Owner opens member.
2. Select Archive.
3. Confirm.
4. Member disappears from default active member lists.
5. Financial/subscription history remains unchanged.
6. Member can be restored later.
7. Audit event is created.
