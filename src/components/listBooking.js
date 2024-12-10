import React, { useState, useEffect } from 'react';
import { Table, Container, Button, Modal, Form, InputGroup, FormControl, Pagination, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // Nhập useNavigate từ react-router-dom
import axios from 'axios';
import "./listBooking.css";
import { BASE_URL } from "../utils/config";

const ListBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updatedPayment, setUpdatedPayment] = useState('');
  const [updatedStatus, setUpdatedStatus] = useState('');
  const [updatedCheckin, setUpdatedCheckin] = useState('');
  const [updatedCheckout, setUpdatedCheckout] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locations, setLocation] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);
  const [checkinFilter, setCheckinFilter] = useState('');  // New state for check-in filter
  const [checkoutFilter, setCheckoutFilter] = useState(''); // New state for check-out filter
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 7;
  const [userRole, setUserRole] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // New state for status filter


  const fetchData = async () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser && storedUser.role) {
      setUserRole(storedUser.role);

      // If user is 'staffds', set a default location and hide location dropdown
      if (storedUser.role === 'staff_ds') {
        setSelectedLocation('66f6c536285571f28087c16b');
      } else if (storedUser.role === 'staff_cb') {
        setSelectedLocation('66f6c59f285571f28087c16d');
      } else if (storedUser.role === 'staff_mk') {
        setSelectedLocation('66f6c42f285571f28087c16a');
      }
    }
    axios
      .get(`${BASE_URL}/orderRooms`)
      .then((response) => setBookings(response.data))
      .catch((error) => console.error("Error fetching bookings:", error));

    axios
      .get(`${BASE_URL}/locations`)
      .then((response) => setLocation(response.data))
      .catch((error) => console.error('Error fetching locations:', error));
  }
  useEffect(() => {
    fetchData()

  }, []);

  useEffect(() => {
    fetchCheckBookingTime(bookings)

  }, [bookings])

  const fetchCheckBookingTime = async (bookings) => {
    const today = new Date(); // Lấy ngày hiện tại
    today.setHours(0, 0, 0, 0)
    // Lặp qua tất cả các booking để kiểm tra điều kiện
    bookings.forEach((booking) => {
      // Chuyển checkout date thành đối tượng Date để so sánh
      const checkoutDate = new Date(booking.bookingId.checkout);
      checkoutDate.setHours(0, 0, 0, 0)
      // Kiểm tra nếu ngày hiện tại >= ngày checkout của booking
      if (today >= checkoutDate && booking.bookingId.status === 'Đã đặt') {
        // Gửi yêu cầu API để cập nhật trạng thái của booking và dịch vụ
        axios
          .put(`${BASE_URL}/bookings/update-statuses/${booking.bookingId._id}`, {
            orderServiceStatus: "Đã hủy",
            bookingStatus: "Đã hủy"
          })
          .then((response) => {
            // Giả sử phản hồi chứa thông tin booking đã được cập nhật
            const updatedBooking = response.data.bookingUpdateResult; // Thay thế bằng trường hợp đúng trong response của bạn

            // Cập nhật lại trạng thái booking trong state sau khi nhận được dữ liệu từ server
            setBookings((prevBookings) =>
              prevBookings.map((prevBooking) =>
                prevBooking._id === updatedBooking._id
                  ? { ...prevBooking, status: updatedBooking.status }
                  : prevBooking
              )
            );
          })
          .catch((error) => {
            console.error("Error updating booking status:", error);
          });
      }
    });
  };


  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleEditClick = (booking) => {
    setSelectedBooking(booking);
    setUpdatedPayment(booking.bookingId.payment);
    setUpdatedStatus(booking.bookingId.status);
    setUpdatedCheckin(booking.bookingId.checkin);
    setUpdatedCheckout(booking.bookingId.checkout);
    setShowModal(true);
  };

  const handleRowClick = async (booking) => {
    navigate(`/bookings/${booking.bookingId._id}`);
  };

  const handleUpdateBooking = () => {
    const updatedBooking = {
      ...selectedBooking,
      bookingId: {
        ...selectedBooking.bookingId,
        payment: updatedPayment,
        status: updatedStatus,
        checkin: updatedCheckin,
        checkout: updatedCheckout
      }
    };

    axios
      .put(`${BASE_URL}/bookings/${selectedBooking.bookingId._id}`, updatedBooking.bookingId)
      .then((response) => {
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking._id === selectedBooking._id ? updatedBooking : booking
          )
        );
        setShowModal(false);
      })
      .catch((error) => console.error("Error updating booking:", error));
  };

  const handleCancelClick = (booking) => {
    // Đặt trạng thái local thành 'Đã hủy' trước khi gửi yêu cầu
    booking.status = "Đã hủy";
    const bookingId = booking._id;

    // Gửi yêu cầu API để cập nhật trạng thái của booking và dịch vụ
    axios
      .put(`${BASE_URL}/bookings/update-statuses/${bookingId}`, {
        orderServiceStatus: "Đã hủy",
        bookingStatus: "Đã hủy"
      })
      .then((response) => {
        // Giả sử phản hồi chứa thông tin booking đã được cập nhật
        const updatedBooking = response.data.bookingUpdateResult; // Thay thế bằng trường hợp đúng trong response của bạn

        // Cập nhật lại trạng thái booking trong state sau khi nhận được dữ liệu từ server
        setBookings((prevBookings) =>
          prevBookings.map((prevBooking) =>
            prevBooking.bookingId._id === updatedBooking._id
              ? { ...prevBooking, status: updatedBooking.status }
              : prevBooking
          )
        );
        fetchData()
      })
      .catch((error) => {
        console.error("Lỗi khi hủy booking:", error);
        // Có thể khôi phục trạng thái nếu yêu cầu API thất bại
        booking.status = "Trạng thái cũ";  // Khôi phục trạng thái cũ hoặc xử lý theo cách khác
      });
  };


  const isDateInRange = (date, start, end) => {
    const targetDate = new Date(date);
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (start && end) {
      return targetDate >= startDate && targetDate <= endDate;
    } else if (start) {
      return targetDate >= startDate;
    } else if (end) {
      return targetDate <= endDate;
    }
    return true;
  };

  const filteredBookings = bookings.filter((booking) => {
    const formattedValue = searchQuery.trim().replace(/\s+/g, ' ');
    const bookingId = booking.bookingId._id.toLowerCase();
    const customerName = booking.customerId.fullname.toLowerCase();
    const isMatchingLocation = selectedLocation ? booking.roomCateId.locationId === selectedLocation : true;
    const isMatchingCheckin = isDateInRange(booking.bookingId.checkin, checkinFilter, checkoutFilter);
    const isMatchingStatus = statusFilter ? booking.bookingId.status === statusFilter : true;

    return (
      isMatchingLocation &&
      isMatchingCheckin &&
      isMatchingStatus &&
      (bookingId.includes(formattedValue.toLowerCase()) || customerName.includes(formattedValue.toLowerCase()))
    );
  });

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredBookings.length / rowsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  return (
    <Container>
      <h2 className="text-center my-4">Danh sách Đặt phòng</h2>
      <Row>
        {userRole === "admin" && (
          <Col md={6}>
            <Form.Group controlId="categorySelect" className="my-4">
              <Form.Label>Chọn cơ sở:</Form.Label>
              <Form.Control
                as="select"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="">Chọn cơ sở</option>
                <option value="66f6c42f285571f28087c16a">cơ sở 16 Minh Khai</option>
                <option value="66f6c536285571f28087c16b">cơ sở Đồ Sơn</option>
                <option value="66f6c59f285571f28087c16d">cơ sở Cát Bà</option>
              </Form.Control>
            </Form.Group>
          </Col>
        )}
        <Col md={3}>
          <Form.Group controlId="categorySelect" className="my-4" >
            <Form.Label>Ngày check-in:</Form.Label>
            <FormControl
              type="date"
              style={{ margin: '0 10px' }}
              placeholder="Tìm kiếm theo ngày Check-in"
              value={checkinFilter}
              onChange={(e) => setCheckinFilter(e.target.value)}
            />
          </Form.Group>
        </Col>

        <Col md={3}>
          <Form.Group controlId="categorySelect" className="my-4" >
            <Form.Label>Ngày check-out:</Form.Label>
            <FormControl
              type="date"
              style={{ margin: '0 10px' }}
              placeholder="Tìm kiếm theo ngày Check-out"
              value={checkoutFilter}
              onChange={(e) => setCheckoutFilter(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Search Inputs */}
      <Row>
        <Col md={8}>
          <InputGroup className="mb-3">
            <FormControl
              placeholder="Tìm kiếm theo Mã Đặt phòng hoặc Tên Khách hàng"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <Form.Control
            as="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="Đã đặt">Đã đặt</option>
            <option value="Đã check-in">Đã check-in</option>
            <option value="Yêu cầu hoàn tiền">Yêu cầu hoàn tiền</option>
            <option value="Đã hủy">Đã Hủy</option>
            <option value="Đã hoàn thành">Đã hoàn thành</option>
          </Form.Control>
        </Col>
      </Row>




      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Mã Đặt phòng</th>
            <th>Tên Khách</th>
            <th>Tên phòng</th>
            <th>Số lượng</th>
            <th>Tổng tiền</th>
            <th>Checkin</th>
            <th>Checkout</th>
            <th>Trạng Thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {currentBookings.map((booking) => (
            <tr key={booking._id} onClick={() => handleRowClick(booking)} style={{ cursor: 'pointer' }}>
              <td>{booking.bookingId._id}</td>
              <td>{booking.customerId.fullname}</td>
              <td>{booking.roomCateId.name}</td>
              <td className="text-center">{booking.quantity}</td>
              <td>{formatCurrency(booking.quantity * booking.roomCateId.price)}</td>
              <td>{formatDate(booking.bookingId.checkin)}</td>
              <td>{formatDate(booking.bookingId.checkout)}</td>
              <td>{booking.bookingId.status}</td>
              <td>
                {booking.bookingId.status === "Đã đặt" && (
                  <>
                    {userRole !== "admin" && (
                      <Button
                        variant="warning"
                        className="me-2"
                        onClick={(e) => {
                          e.stopPropagation(); // Ngăn sự kiện onClick của hàng
                          navigate(`/checkin/${booking.bookingId._id}`);
                        }}
                      >
                        Check-in
                      </Button>

                    )}
                  </>
                )}
                {booking.bookingId.status === "Yêu cầu hoàn tiền" && (
                  <>
                    {userRole === "admin" && (
                      <Button
                        variant="danger"
                        onClick={(e) => {
                          e.stopPropagation(); // Ngăn sự kiện onClick của hàng
                          handleCancelClick(booking.bookingId);
                        }}
                      >
                        Hủy
                      </Button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {/* Pagination Controls */}
      <Pagination>
        {[...Array(totalPages)].map((_, index) => (
          <Pagination.Item
            key={index + 1}
            active={index + 1 === currentPage}
            onClick={() => handlePageChange(index + 1)}
          >
            {index + 1}
          </Pagination.Item>
        ))}
      </Pagination>


      {/* Detail Modal
      {selectedBookingDetails && (
        <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Thông tin Đặt phòng</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Mã Đặt phòng: {selectedBookingDetails.bookingId._id}</p>
            <p>Tên khách: {selectedBookingDetails.customerId.fullname}</p>
            <p>Phòng: {selectedBookingDetails.roomCateId.name}</p>
            <p>Số lượng: {selectedBookingDetails.quantity}</p>
            <p>Tổng tiền: {selectedBookingDetails.quantity * selectedBookingDetails.roomCateId.price}</p>
            <p>Checkin: {formatDate(selectedBookingDetails.bookingId.checkin)}</p>
            <p>Checkout: {formatDate(selectedBookingDetails.bookingId.checkout)}</p>
            <p>Thanh toán: {selectedBookingDetails.bookingId.payment}</p>
            <p>Trạng thái: {selectedBookingDetails.bookingId.status}</p>
            <p>Tên giấy tờ: {selectedBookingDetails.identifyName || 'Chưa có thông tin'}</p>
            <p>Mã giấy tờ: {selectedBookingDetails.identifyCode || 'Chưa có thông tin'}</p>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="primary"
              onClick={() => {
                navigate('/updateBookingInfo', { state: { selectedBookingDetails } });
              }}
            >
              Chỉnh sửa
            </Button>
            {userRole === "admin" && (
              <Button
                variant="info"
                style={{ margin: ' 0px 10px' }}
                onClick={() => {
                  navigate('/historyBookingChange', { state: { bookingId: selectedBookingDetails.bookingId._id } }); // Chuyển hướng với bookingId
                }}
              >
                Lịch sử
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
              Đóng
            </Button>

          </Modal.Footer>
        </Modal>
      )} */}

    </Container>
  );
};

export default ListBooking;