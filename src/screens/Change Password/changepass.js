import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './changepass.css';
import { BASE_URL } from "../../utils/config";

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (oldPassword.length < 6) {
      setError('Mật khẩu cũ phải trên 6 ký tự');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải trên 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Nhập lại mật khẩu mới không khớp, vui lòng nhập lại');
      return;
    }

    try {
      // Gửi yêu cầu đổi mật khẩu tới backend
      const userName = JSON.parse(localStorage.getItem('user')).username;
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:9999/change-password',
        {
          username: userName,
          currentPassword: oldPassword,
          newPassword: newPassword,
        },
      );

      // Xử lý phản hồi thành công
      setMessage(response.data.message || 'Thay đổi mật khẩu thành công');
      setTimeout(() => {
        navigate('/'); // Điều hướng tới trang login
      }, 2000);
    } catch (error) {
      // Xử lý lỗi
      if (error.response || error.response.data) {
        setError(error.response.data.message || 'Đã xảy ra lỗi, vui lòng thử lại');
      } else {
        setError('Lỗi không xác định. Vui lòng thử lại.');
      }
    };
  }

  return (
    <section>
      <Container>
        <Row className="justify-content-center">
          <Col lg="6">
            <div className="change-password__form">
              <h2>Đổi mật khẩu</h2>

              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="oldPassword">
                  <Form.Label>Mật khẩu cũ:</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Old Password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="newPassword">
                  <Form.Label>Mật khẩu mới:</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="confirmPassword">
                  <Form.Label>Nhập lại mật khẩu:</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
                {message && <p className="success-message">{message}</p>}
                <br />
                <Button className="btn primary_btn" type="submit">
                  Đổi mật khẩu
                </Button>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default ChangePassword;
