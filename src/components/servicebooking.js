import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BASE_URL } from "../utils/config";

const ServiceBookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [bookingsLocation, setBookingsLocation] = useState([]);
  const [bookingsAll, setBookingAll] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchBookingId, setSearchBookingId] = useState('');
  const [searchCustomerName, setSearchCustomerName] = useState('');
  const [searchServiceName, setSearchServiceName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [searchStatus, setSearchStatus] = useState(''); // Add status filter
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedNotes, setExpandedNotes] = useState([]);
  const [staff, setStaff] = useState(null);
  const [locationFilter, setLocationFilter] = useState('');

  const rowsPerPage = 7;


  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userResponse = JSON.parse(storedUser);
      setStaff(userResponse);
    }

  }, []);


  const fetchServiceBookings = async () => {
    if (staff) {
      let location = '';
      if (staff.role === 'staff_ds') {
        location = '66f6c536285571f28087c16b';
        setLocationFilter(location);
      } else if (staff.role === 'staff_mk') {
        location = '66f6c42f285571f28087c16a';
        setLocationFilter(location);
      } else if (staff.role === 'staff_cb') {
        location = '66f6c59f285571f28087c16d';
        setLocationFilter(location);
      }

      if (location || locationFilter) {
        let locationid = location || locationFilter;

        let responseBLData = [];
        try {
          const responseBL = await axios.get(`${BASE_URL}/orderServices/location/${locationid}`);
          responseBLData = responseBL.data || [];
        } catch (error) {
          console.warn(`Error fetching orderServices for location ${locationid}:`, error.message);
          responseBLData = []; // Set to empty array on error
        }

        try {
          const response = await axios.get(`${BASE_URL}/service-bookings`);
          setBookingsLocation(responseBLData);
          setBookingAll(response.data || []);

          const filteredResponseBL = response.data.filter(item =>
            responseBLData.some(order => order._id === item._id)
          );

          setBookings(filteredResponseBL);
          setFilteredBookings(filteredResponseBL || []);
        } catch (error) {
          console.error('Error fetching service bookings:', error.message);
          setBookings([]);
          setFilteredBookings([]);
        }
      } else {
        try {
          const response = await axios.get(`${BASE_URL}/service-bookings`);
          setBookings(response.data || []);
          setFilteredBookings(response.data || []);
        } catch (error) {
          console.error('Error fetching all service bookings:', error.message);
          setBookings([]);
          setFilteredBookings([]);
        }
      }
    }
  };



  useEffect(() => {
    fetchServiceBookings();
  }, [staff, locationFilter]);

  useEffect(() => {
    const filtered = bookings.filter((booking) => {
      const matchesBookingId = booking.bookingId
        ?.toString()
        .includes(searchBookingId.trim().replace(/\s+/g, ' '));

      const matchesCustomerName = booking?.customerName
        ?.toLowerCase()
        .includes(searchCustomerName?.toLowerCase().trim().replace(/\s+/g, ' '));

      const matchesServiceName = booking?.serviceName
        ? booking.serviceName
          .toLowerCase()
          .includes(searchServiceName?.toLowerCase().trim().replace(/\s+/g, ' '))
        : true; // Allow matches if serviceName is undefined

      const matchesStartTime =
        !startTime ||
        new Date(booking.time).toISOString().slice(0, 10) === new Date(startTime).toISOString().slice(0, 10);

      const matchesStatus = !searchStatus || booking.status === searchStatus; // Apply status filter

      return (
        matchesBookingId &&
        matchesCustomerName &&
        matchesServiceName &&
        matchesStartTime &&
        matchesStatus // Include status filter in the conditions
      );
    });

    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to the first page when filtering
  }, [searchBookingId, searchCustomerName, searchServiceName, startTime, endTime, searchStatus, bookings]);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await axios.put(`${BASE_URL}/orderServices/${bookingId}`, {
        status: newStatus,
      });
      const updatedBookings = bookings.map((booking) =>
        booking.bookingId === bookingId ? { ...booking, status: newStatus } : booking
      );
      setBookings(updatedBookings);
      setFilteredBookings(updatedBookings); // Update the filtered list to reflect the changes
      fetchServiceBookings();
      toast.success('Đã thay đổi trạng thái thành công.', {
        position: "top-right",
      });
    } catch (err) {
      console.error('Failed to update status', err);
      toast.error('Có lỗi xảy ra . Vui lòng thử lại.', {
        position: "top-right",
      });
    }
  };

  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredBookings.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredBookings.length / rowsPerPage);

  // Format date with 7-hour adjustment
  const formatDate = (date) => {
    if (!date) return 'N/A'; // Handle null or undefined dates

    const adjustedDate = new Date(new Date(date).getTime() - 7 * 60 * 60 * 1000); // Subtract 7 hours
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };

    return new Intl.DateTimeFormat('vi-VN', options).format(adjustedDate);
  };


  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleToggleNote = (bookingId) => {
    setExpandedNotes((prevExpandedNotes) => {
      if (prevExpandedNotes.includes(bookingId)) {
        return prevExpandedNotes.filter((id) => id !== bookingId);
      }
      return [...prevExpandedNotes, bookingId];
    });
  };

  return (
    <div className="container">
      <h2 className="text-center">Danh sách đặt dịch vụ khách hàng</h2>
      <br />
      <ToastContainer />
      {/* Search Fields */}
      <div className="row mb-3 d-flex justify-content-evenly">

        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm Tên Khách Hàng"
            value={searchCustomerName}
            onChange={(e) => setSearchCustomerName(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm Tên Dịch Vụ"
            value={searchServiceName}
            onChange={(e) => setSearchServiceName(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <input
            type="date"
            className="form-control"
            placeholder="Ngày sử dụng"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

      </div>
      <div className="row mb-3 d-flex justify-content-evenly">
        {staff?.role === "admin" && (
          <div className="col-md-4">

            <select
              className="form-select"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option value="">Chọn cơ sở</option>
              <option value="66f6c42f285571f28087c16a">cơ sở 16 Minh Khai</option>
              <option value="66f6c536285571f28087c16b">cơ sở Đồ Sơn</option>
              <option value="66f6c59f285571f28087c16d">cơ sở Cát Bà</option>
            </select>

          </div>
        )}
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm Booking ID"
            value={searchBookingId}
            onChange={(e) => setSearchBookingId(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={searchStatus}
            onChange={(e) => setSearchStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Đã đặt">Đã đặt</option>
            <option value="Đang sử dụng">Đang sử dụng</option>
            <option value="Đã cung cấp">Đã cung cấp</option>
            <option value="Đã hủy">Đã hủy</option>
          </select>
        </div>
      </div>

      {bookings.length === 0 ? (
        <p>Loading.....</p>
      ) : (
        <div>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Mã đơn hàng</th>
                <th>Tên khách hàng</th>
                <th>Tên dịch vụ</th>
                <th>Đơn giá</th>
                <th>Số lượng</th>
                <th>Tổng tiền</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((booking, index) => (
                <React.Fragment key={index}>
                  <tr>
                    <td>{booking.bookingId}</td>
                    <td>{booking.customerName}</td>
                    <td>{booking.serviceName}</td>
                    <td>{formatCurrency(booking.unitPrice)}</td>
                    <td className="text-center">{booking.quantity}</td>
                    <td>{formatCurrency(booking.unitPrice * booking.quantity)}</td>
                    <td>{formatDate(booking.time)}</td>
                    <td>
                      <select
                        className="form-select"
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                      >
                        <option value="Đã đặt">Đã đặt</option>
                        <option value="Đang sử dụng">Đang sử dụng</option>
                        <option value="Đã cung cấp">Đã cung cấp</option>
                        <option value="Đã hủy">Đã hủy</option>
                      </select>
                    </td>
                  </tr>
                  {/* Notes Row */}
                  {booking.note !== 'N/A' && (
                    <tr >
                      <td colSpan="8">
                        {booking.note.length > 100 ? (
                          <div style={{ textAlign: 'left' }}>
                            {/* Kiểm tra nếu _id đang mở rộng */}
                            {expandedNotes.includes(booking._id)
                              ? booking.note
                              : `${booking.note.slice(0, 100)}...`}
                            <button
                              className="btn btn-link p-0"
                              onClick={() => handleToggleNote(booking._id)}
                            >
                              {/* Hiển thị trạng thái mở rộng hoặc thu gọn */}
                              {expandedNotes.includes(booking._id) ? 'Thu gọn' : 'Xem thêm'}
                            </button>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'left' }}>{booking.note}</div>
                        )}

                      </td>
                    </tr>
                  )}

                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <nav>
            <ul className="pagination justify-content-center">
              {Array.from({ length: totalPages }, (_, i) => (
                <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                    {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};

export default ServiceBookingList;
