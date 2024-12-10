import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Row, Col, Modal, Alert } from 'react-bootstrap';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { BASE_URL } from "../utils/config";


// Component StaffAccount to display individual staff information
const StaffAccount = ({ staff, onDelete, onEdit }) => {
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <tr>
      <td>{staff.username}</td>
      <td>{staff.fullname}</td>
      {/* <td>
        {showPassword ? staff.password : '********'}
        <Button
          variant="link"
          size="sm"
          className="mx-1"
          onClick={togglePasswordVisibility}
          style={{ padding: 0 }}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </Button>
      </td> */}
      <td>{staff.email}</td>
      <td>{staff.phone}</td>
      <td>{staff.role}</td>
      <td>
        <Button variant="warning" size="sm" className="mx-1" onClick={() => onEdit(staff)}>
          Chỉnh sửa
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(staff._id)}>
          Xóa
        </Button>
      </td>
    </tr>
  );
};
// Component ListStaffAccount to manage staff accounts
const ListStaffAccount = () => {
  const [staffData, setStaffData] = useState([]);
  const [searchUsername, setSearchUsername] = useState(''); // Search by username
  const [searchRole, setSearchRole] = useState(''); // Search by role
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const [isEditMode, setIsEditMode] = useState(false); // State to determine if we're editing
  const [selectedStaff, setSelectedStaff] = useState(null); // Staff data for editing
  const [success, setSuccess] = useState('');
  const [fail, setFail] = useState('');
  const [newStaff, setNewStaff] = useState({
    username: '',
    fullname: '',
    password: '',
    email: '',
    phone: '',
    role: 'staff_cb', // Default role
  });
  const [errors, setErrors] = useState({}); // Validation errors

  // Function to fetch staff data
  const fetchDataStaff = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/staffs`);
      setStaffData(response.data);
    } catch (error) {
      console.error("Error fetching staff data:", error);
    }
  };

  useEffect(() => {
    fetchDataStaff(); // Call the fetch function inside useEffect
  }, [newStaff]);

  // Validate input fields
  const validateInputs = () => {
    const newErrors = {};

    // Fullname validation (letters and spaces only, accents are allowed)
    const fullnameRegex = /^([A-ZÀ-Ý][a-zàáảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]*|[a-zàáảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]+)(\s([A-ZÀ-Ý][a-zàáảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]*|[a-zàáảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]+))*$/;
    if (!fullnameRegex.test(newStaff.fullname) || !newStaff.fullname) {
      newErrors.fullname = "Họ và tên chỉ được chứa chữ cái và chỉ có một dấu cách giữa các từ, không được viết hoa giữa hoặc cuối từ";
    }

    // Username validation (no spaces, no accents)
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(newStaff.username) || newStaff.username.length > 12 || newStaff.username.length < 6) {
      newErrors.username = "Tên người dùng chỉ chứa ký tự không dấu và không có khoảng trống, phải có từ 6-12 ký tự.";
    }

    // Password validation (minimum 6 characters)
    if (newStaff.password.length < 6 || newStaff.password.length > 20) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự và tối đa 20 ký tự.";
    }

    // Email validation (proper email format)
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(newStaff.email)) {
      newErrors.email = "Email không hợp lệ.";
    }

    // Phone number validation (Vietnamese phone number format)
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(newStaff.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ.";
    }


    // Check for duplicate username
    const usernameExists = staffData.some(staff => staff.username === newStaff.username && staff._id !== selectedStaff?._id);
    if (usernameExists) {
      newErrors.username = "Tên người dùng đã tồn tại.";
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Returns true if no errors
  };

  // Handle delete staff
  const handleDelete = (id) => {
    axios
      .delete(`${BASE_URL}/staffs/${id}`)
      .then(() => {
        setStaffData(staffData.filter(staff => staff._id !== id));
        setSuccess('Xóa thành công');
        setFail('')
      })
      .catch((error) => {
        console.error("Error deleting staff:", error);
        setFail('Xóa thất bại')
        setSuccess('')
      });
    fetchDataStaff()
  };

  // Handle show modal (for both create and edit)
  const handleShowModal = () => setShowModal(true);

  // Handle close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditMode(false); // Reset mode to create after closing modal
    setSelectedStaff(null); // Clear selected staff after closing modal
    setNewStaff({
      username: '',
      fullname: '',
      password: '',
      email: '',
      phone: '',
      role: 'staff_cb',
    });
    setErrors({}); // Clear errors after closing modal
  };

  // Handle change in input fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewStaff((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle staff creation
  const handleCreateStaff = () => {
    if (validateInputs()) {
      axios
        .post(`${BASE_URL}/register`, newStaff)
        .then((response) => {
          setStaffData([...staffData, response.data]);
          handleCloseModal();
          setSuccess('Tạo tài khoản mới thành công');
          setFail('')
        })
        .catch((error) => {
          // Kiểm tra lỗi HTTP 409 và gán message vào newErrors.fullname
          if (error.response && error.response.status === 409) {
            setErrors({ username: error.response.data.message || 'Tên người dùng đã tồn tại' });

          } else {
            setFail("Lỗi kết nối tới máy chủ!");
            setSuccess('')
          }
        });

    }
    fetchDataStaff();
  };


  // Handle staff editing
  const handleEditStaff = (staff) => {
    setIsEditMode(true); // Set mode to edit
    setSelectedStaff(staff); // Set the staff to be edited
    setNewStaff({
      username: staff.username,
      fullname: staff.fullname,
      password: staff.password,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
    });
    handleShowModal(); // Show modal with pre-filled data
  };

  // Handle staff update
  const handleUpdateStaff = () => {
    if (validateInputs()) {
      axios
        .put(`${BASE_URL}/staffs/${selectedStaff._id}`, newStaff)
        .then((response) => {
          setStaffData(
            staffData.map(staff => staff._id === selectedStaff._id ? response.data : staff)
          );
          setSuccess('Cập nhật thông tin thành công');
          setFail('');
          handleCloseModal(); // Close modal after update
        })
        .catch((error) => {
          console.error("Error updating staff:", error)
          setFail('Cập nhật thông tin thất bại');
          setSuccess('');
        });
      fetchDataStaff()
    }
  };

  // Filter staff data by username and role
  const filteredStaffData = staffData.filter(staff => {
    const username = staff.username || ''; // Đảm bảo username luôn là một chuỗi
    const formattedValue = searchUsername.trim().replace(/\s+/g, ' ') || ''; // Đảm bảo formattedValue luôn là một chuỗi
    return (
      username.toLowerCase().includes(formattedValue.toLowerCase()) &&
      (searchRole === '' || staff.role === searchRole)
    );
  });


  return (
    <Container>
      <h2 className="text-center my-4">Danh sách tài khoản nhân viên</h2>

      {/* Search input */}
      <Row className="mb-3">
        <Col md={5}>
          <Form.Control
            type="text"
            placeholder="Tìm theo tên người dùng"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
          />
        </Col>
        <Col md={5}>
          <Form.Select
            value={searchRole}
            onChange={(e) => setSearchRole(e.target.value)}
          >
            <option value="">Tất cả vai trò</option>
            <option value="admin">Admin</option>
            <option value="staff_mk">Lễ tân Minh Khai</option>
            <option value="staff_ds">Lễ tân Đồ Sơn</option>
            <option value="staff_cb">Lễ tân Cát Bà</option>
          </Form.Select>
        </Col>
        <Col md={2} className='text-center'>
          <Button className="bg-success" onClick={() => { setIsEditMode(false); setNewStaff({ username: '', password: '', email: '', phone: '', role: 'staff_cb' }); handleShowModal(); }}>
            Tạo tài khoản
          </Button>
        </Col>
      </Row>
      {/* Hiển thị thông báo nếu có */}
      {success && <Alert variant="success">{success}</Alert>}
      {fail && <Alert variant="danger">{fail}</Alert>}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Tên người dùng</th>
            <th>Họ và tên</th>
            {/* <th>Mật khẩu</th> */}
            <th>Email</th>
            <th>SĐT</th>
            <th>Vai trò</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredStaffData.map((staff) => (
            <StaffAccount key={staff._id} staff={staff} onDelete={handleDelete} onEdit={handleEditStaff} />
          ))}
        </tbody>
      </Table>

      {/* Modal for creating or editing staff */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditMode ? 'Chỉnh sửa tài khoản nhân viên' : 'Tạo tài khoản nhân viên'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formUsername">
              <Form.Label>Tên người dùng</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={newStaff.username}
                onChange={handleChange}
                isInvalid={!!errors.username}
                disabled={isEditMode} // Disable the field if in edit mode
              />
              <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="formPassword">
              <Form.Label>Họ và tên:</Form.Label>
              <Form.Control
                type="text"
                name="fullname"
                value={newStaff.fullname}
                onChange={handleChange}
                isInvalid={!!errors.fullname}
              />
              <Form.Control.Feedback type="invalid">{errors.fullname}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="formPassword">
              <Form.Label>Mật khẩu</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={newStaff.password}
                onChange={handleChange}
                isInvalid={!!errors.password}
              />
              <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="formEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={newStaff.email}
                onChange={handleChange}
                isInvalid={!!errors.email}
              />
              <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="formPhone">
              <Form.Label>SĐT</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={newStaff.phone}
                onChange={handleChange}
                isInvalid={!!errors.phone}
              />
              <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="formRole">
              <Form.Label>Vai trò</Form.Label>
              <Form.Select
                name="role"
                value={newStaff.role}
                onChange={handleChange}
                disabled={isEditMode}
              >
                <option value="staff_cb">Lễ tân Cát Bà</option>
                <option value="staff_ds">Lễ tân Đồ Sơn</option>
                <option value="staff_mk">Lễ tân Minh Khai</option>
                <option value="chef">Bếp</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>

          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Đóng
          </Button>
          <Button variant="primary" onClick={isEditMode ? handleUpdateStaff : handleCreateStaff}>
            {isEditMode ? 'Cập nhật' : 'Tạo tài khoản'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ListStaffAccount;
