const Table = require('../models/Table');
const Reservation = require('../models/Reservation');

// GET /api/tables
exports.getTables = async (req, res, next) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    res.json(tables);
  } catch (err) {
    next(err);
  }
};

// POST /api/tables (admin only) - add a new table
exports.createTable = async (req, res, next) => {
  try {
    const table = await Table.create(req.body);
    res.status(201).json(table);
  } catch (err) {
    next(err);
  }
};

// GET /api/tables/availability?date=YYYY-MM-DD&timeSlot=19:00-20:00
exports.getAvailability = async (req, res, next) => {
  try {
    const { date, timeSlot } = req.query;
    if (!date || !timeSlot) {
      return res.status(400).json({ message: 'date and timeSlot are required' });
    }

    const allTables = await Table.find();
    const bookedReservations = await Reservation.find({
      date,
      timeSlot,
      status: 'confirmed',
    }).select('table');

    const bookedTableIds = new Set(bookedReservations.map((r) => r.table.toString()));
    const availability = allTables.map((t) => ({
      _id: t._id,
      tableNumber: t.tableNumber,
      capacity: t.capacity,
      isAvailable: !bookedTableIds.has(t._id.toString()),
    }));

    res.json(availability);
  } catch (err) {
    next(err);
  }
};

// POST /api/tables/reserve
exports.reserveTable = async (req, res, next) => {
  try {
    const { tableId, date, timeSlot, guests } = req.body;
    if (!tableId || !date || !timeSlot || !guests) {
      return res.status(400).json({ message: 'tableId, date, timeSlot and guests are required' });
    }

    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json({ message: 'Table not found' });

    if (guests > table.capacity) {
      return res.status(400).json({ message: `Table only seats ${table.capacity} guests` });
    }

    // The unique partial index on (table, date, timeSlot, status=confirmed)
    // guarantees this fails atomically if the table is already booked,
    // which prevents double bookings even under concurrent requests.
    const reservation = await Reservation.create({
      customer: req.user.id,
      table: tableId,
      date,
      timeSlot,
      guests,
    });

    req.io.emit('reservation:created', { reservation });
    res.status(201).json(reservation);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This table is already booked for the selected date/time' });
    }
    next(err);
  }
};

// PATCH /api/tables/reserve/:id/cancel
exports.cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    const isOwner = reservation.customer.toString() === req.user.id;
    const isStaff = ['admin', 'waiter'].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'Not allowed to cancel this reservation' });
    }

    reservation.status = 'cancelled';
    await reservation.save();
    req.io.emit('reservation:cancelled', { reservationId: reservation._id });
    res.json(reservation);
  } catch (err) {
    next(err);
  }
};

// GET /api/tables/reserve/my
exports.getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ customer: req.user.id })
      .populate('table')
      .sort({ date: -1 });
    res.json(reservations);
  } catch (err) {
    next(err);
  }
};
