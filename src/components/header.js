import React, { useState, useEffect } from "react";
import { Navbar, Nav, Dropdown, ListGroup } from "react-bootstrap";
import { RxAvatar } from "react-icons/rx";
import { NavLink } from "react-router-dom";
import { MdNotificationsActive, MdNotifications } from "react-icons/md";
import './header.css';
import axios from "axios";
import { BASE_URL } from "../utils/config";

const Header = () => {
  const [newNoti, setNewNoti] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [location, setLocation] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (user && user.role) {
      if (user.role === 'staff_ds') {
        setLocation('66f6c536285571f28087c16b');
      } else if (user.role === 'staff_cb') {
        setLocation('66f6c59f285571f28087c16d');
      } else if (user.role === 'staff_mk') {
        setLocation('66f6c5c9285571f28087c16a');
      }
    }
  }, [user]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${BASE_URL}/chats`);
        if (response.ok) {
          const data = await response.json();
          if (data.length > notifications.length) {
            setNewNoti(true);
          }
          setNotifications(data);
        } else {
          console.error("Failed to fetch notifications");
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, [notifications]);

  const filteredNotifications = notifications.filter(
    (notification) => notification.locationId?._id === location || location === ''
  );

  const timeAgo = (inputTime) => {
    if (!inputTime) return "Không có thời gian hợp lệ";
    const now = new Date();
    const inputDate = new Date(inputTime);
    if (isNaN(inputDate)) return "Thời gian không hợp lệ";
    const diff = now - inputDate;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (years > 0) return `${years} năm trước`;
    if (months > 0) return `${months} tháng trước`;
    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    if (minutes > 0) return `${minutes} phút trước`;
    return `${seconds} giây trước`;
  };

  const handleDropdownToggle = () => {
    setNewNoti(false);
  };

  return (
    <Navbar bg="light" expand="lg" className="shadow-sm">
      <Nav className="ml-auto">
        <Dropdown align="end" onToggle={handleDropdownToggle}>
          <Dropdown.Toggle variant="outline-secondary" id="dropdown-basic">
            {newNoti ? <MdNotificationsActive /> : <MdNotifications />}
          </Dropdown.Toggle>
          <Dropdown.Menu style={{ width: "300px" }}>
            <Dropdown.Header>Thông báo</Dropdown.Header>
            <ListGroup
              variant="flush"
              style={{ maxHeight: "200px", overflowY: "auto" }}
            >
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification, index) => (
                  <ListGroup.Item key={index} action>
                    {timeAgo(notification.createdAt)} -{" "}
                    {notification.content || "New notification"}
                  </ListGroup.Item>
                ))
              ) : (
                <div className="text-center py-3 text-muted">
                  No new notifications
                </div>
              )}
            </ListGroup>
          </Dropdown.Menu>
        </Dropdown>
        <NavLink className={"nav-link"} to="/change-password">
          <RxAvatar /> Thay đổi mật khẩu
        </NavLink>
      </Nav>
    </Navbar>
  );
};

export default Header;
