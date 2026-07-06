import { test, expect } from '@playwright/test';

let authToken: string;
let createdBookingId: number;

const sampleBooking = {
  firstname: 'Jim',
  lastname: 'Brown',
  totalprice: 111,
  depositpaid: true,
  bookingdates: { checkin: '2026-01-01', checkout: '2026-01-05' },
  additionalneeds: 'Breakfast',
};

test.describe('restful-booker API suite', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post('/auth', {
      data: { username: 'admin', password: 'password123' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    authToken = body.token;
    expect(authToken).toBeTruthy();
  });

  // Positive path: create a booking successfully and capture its ID.
  test('create booking', async ({ request }) => {
    const res = await request.post('/booking', { data: sampleBooking });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.bookingid).toBeDefined();
    expect(body.booking.firstname).toBe(sampleBooking.firstname);
    createdBookingId = body.bookingid;
  });

  // Positive path: read the booking back using the created booking ID.
  test('read booking', async ({ request }) => {
    const res = await request.get(`/booking/${createdBookingId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.lastname).toBe(sampleBooking.lastname);
    expect(body.bookingdates.checkin).toBe(sampleBooking.bookingdates.checkin);
  });

  // Positive path: update the booking with a valid authentication token.
  test('update booking with valid auth', async ({ request }) => {
    const res = await request.put(`/booking/${createdBookingId}`, {
      headers: { Cookie: `token=${authToken}` },
      data: { ...sampleBooking, totalprice: 222 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.totalprice).toBe(222);
  });

  // Positive path: delete the booking using valid authentication.
  test('delete booking with valid auth', async ({ request }) => {
    const res = await request.delete(`/booking/${createdBookingId}`, {
      headers: { Cookie: `token=${authToken}` },
    });
    expect([200, 201]).toContain(res.status());

    const verify = await request.get(`/booking/${createdBookingId}`);
    expect(verify.status()).toBe(404);
  });

  // Negative test: updating a booking without authentication should be rejected.
  test('negative: updating a booking without auth is rejected', async ({ request }) => {
    const createRes = await request.post('/booking', { data: sampleBooking });
    const { bookingid } = await createRes.json();

    const res = await request.put(`/booking/${bookingid}`, {
      data: { ...sampleBooking, totalprice: 999 },
      // deliberately no auth cookie/header
    });
    expect(res.status()).toBe(403);
  });

  // Negative test: reading a non-existent booking should return 404.
  test('negative: reading a non-existent booking returns 404', async ({ request }) => {
    const res = await request.get('/booking/999999999');
    expect(res.status()).toBe(404);
  });
});
