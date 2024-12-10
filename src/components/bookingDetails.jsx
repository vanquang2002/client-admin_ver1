import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import "./bookingDetails.css";
import { Col, Container, Row, Button, Form, Card, Modal } from 'react-bootstrap';
import { format } from 'date-fns';
import AddServiceForm from './bookingRoom/addServiceForm';
import UpdateAgencyOrder from './UpdateAgencyOrder';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom'; // Nhập useNavigate từ react-router-dom
import { FaArrowRight } from "react-icons/fa";
import { BASE_URL } from "../utils/config";
// // Cấu hình react-toastify
// toast.configure();

const BookingDetails = () => {
    const { bookingId } = useParams();
    const [orderRooms, setOrderRooms] = useState([]);
    const [Rooms, setRooms] = useState([]);
    const [orderServices, setOrderServices] = useState([]);
    const [location, setLocation] = useState({});
    const [Agency, setAgency] = useState({});
    const [isUpdating, setIsUpdating] = useState(false);
    const [expandedNotes, setExpandedNotes] = useState({}); // Trạng thái để lưu ghi chú được mở rộng
    const addServiceRef = useRef(null);
    const [newBookingPrice, setNewBookingPrice] = useState(0);
    const [note, setNote] = useState(orderRooms[0]?.bookingId?.note || '');
    const roomCategoriesRef = useRef(null);
    const [updatedQuantities, setUpdatedQuantities] = useState({});
    const [staff, setStaff] = useState(null);
    const [contractCode, setContractCode] = useState(""); // State lưu mã hợp đồng
    const [price, setPrice] = useState(); // State lưu giá cả
    const [showModal, setShowModal] = useState(false);
    const [remainingRooms, setRemainingRooms] = useState({});
    const [quantityError, setQuantityError] = useState({});
    const [refundTimeOut, setRefundTimeOut] = useState(true)
    const [locationId, setLocationId] = useState(null);


    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const userResponse = JSON.parse(storedUser);
            setStaff(userResponse);
        }
    }, [])

    useEffect(() => {
        if (staff) {
            if (staff.role === 'staff_mk') {
                setLocationId('66f6c42f285571f28087c16a');
            } else if (staff.role === 'staff_ds') {
                setLocationId('66f6c536285571f28087c16b');
            } else if (staff.role === 'staff_cb') {
                setLocationId('66f6c59f285571f28087c16d');
            }
        }

    }, [staff]); // Only update locationId when staff changes

    useEffect(() => {
        setNote(orderRooms[0]?.bookingId?.note || '');
    }, [orderRooms]);

    useEffect(() => {
        const checkRefundTimeOut = () => {
            const checkinDate = new Date(orderRooms[0]?.bookingId?.checkin);
            checkinDate.setHours(0, 0, 0, 0)
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0)
            const daysBeforeCheckin = Math.floor((checkinDate - currentDate) / (1000 * 3600 * 24));

            if (daysBeforeCheckin >= 2) {

                setRefundTimeOut(true); // Được hoàn tiền nếu còn ít nhất 2 ngày trước ngày checkin
            } else {

                setRefundTimeOut(false); // Không được hoàn tiền nếu ít hơn 2 ngày trước ngày checkin
            }
        };

        if (orderRooms.length > 0) { // Kiểm tra orderRooms không rỗng
            checkRefundTimeOut();
        }
    }, [orderRooms]);

    // Fetch room data for all orderRooms
    const fetchRoomData = async (orderRooms) => {
        try {
            const updatedRemainingRooms = {};

            for (const orderRoom of orderRooms) {
                const { receiveRoom, returnRoom, roomCateId } = orderRoom;

                const roomCateIdValue = roomCateId?._id;
                if (!roomCateIdValue) {
                    console.warn(`roomCateId is missing for orderRoom: ${JSON.stringify(orderRoom)}`);
                    continue;
                }

                const bookedRoomsResponse = await axios.get(
                    `${BASE_URL}/orderRooms/totalbycategory/?checkInDate=${receiveRoom}&checkOutDate=${returnRoom}`
                );

                const totalRoomsResponse = await axios.get(`${BASE_URL}/rooms/category/totals`);

                const bookedRooms = bookedRoomsResponse.data.find(item => item.roomCateId === roomCateIdValue)?.totalRooms || 0;
                const totalRooms = totalRoomsResponse.data.categoryTotals.find(item => item.roomCateId === roomCateIdValue)?.totalRooms || 0;

                updatedRemainingRooms[roomCateIdValue] = totalRooms - bookedRooms;
            }

            setRemainingRooms(updatedRemainingRooms); // Update state
            // console.log('Updated remaining rooms:', updatedRemainingRooms);
        } catch (error) {
            console.error('Error fetching room data:', error);
        }
    };


    // Fetch booking details
    const fetchBookingDetails = async () => {
        try {
            const [orderRoomsResponse, orderServiceResponse, roomsResponse] = await Promise.all([
                axios.get(`${BASE_URL}/orderRooms/booking/${bookingId}`),
                axios.get(`${BASE_URL}/orderServices/booking/${bookingId}`),
                axios.get(`${BASE_URL}/rooms/booking/${bookingId}`)
            ]);
            const fetchedOrderRooms = orderRoomsResponse.data;
            setOrderRooms(fetchedOrderRooms);
            setOrderServices(orderServiceResponse.data);
            setRooms(roomsResponse.data.rooms);

            // Fetch remaining rooms after fetching orderRooms
            await fetchRoomData(fetchedOrderRooms);

        } catch (error) {
            console.error('Error fetching booking details:', error);
        }
    };



    // Lấy thông tin vị trí từ ID phòng
    const fetchLocationAndAgency = async (roomCateId, customerId) => {
        try {
            const locationsResponse = await axios.get(`${BASE_URL}/roomCategories/${roomCateId}`);
            setLocation(locationsResponse.data.locationId);
            const AgencyResponse = await axios.get(`${BASE_URL}/agencies/customer/${customerId}`);
            setAgency(AgencyResponse.data);
        } catch (error) {
            console.error('Error fetching location or agencies details:', error);
        }
    };


    // Gọi API khi trang được tải
    useEffect(() => {
        fetchBookingDetails();
    }, [bookingId]);

    // Cập nhật vị trí khi có thay đổi về phòng
    useEffect(() => {
        if (orderRooms.length > 0) {
            const { roomCateId, customerId } = orderRooms[0];
            if (roomCateId) {
                fetchLocationAndAgency(roomCateId._id, customerId._id);
            }
        }
    }, [orderRooms]);

    useEffect(() => {
        if (orderRooms.length > 0) {
            fetchRoomData(orderRooms);
        }
    }, [orderRooms]);


    // Hàm xử lý khi click vào nút "Xem thêm"
    const toggleNote = (id) => {
        setExpandedNotes((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    // const handleQuantityChange = async (orderRoomId, quantity, emptyRoom) => {
    //     const newQuantity = Math.max(1, Number(quantity));

    //     if (newQuantity > emptyRoom) {
    //         setQuantityError(prev => ({
    //             ...prev,
    //             [orderRoomId]: `Maximum available rooms: ${emptyRoom}`,
    //         }));
    //         return;
    //     }

    //     setQuantityError(prev => {
    //         const { [orderRoomId]: removed, ...rest } = prev;
    //         return rest;
    //     });

    //     setUpdatedQuantities(prev => ({
    //         ...prev,
    //         [orderRoomId]: newQuantity,
    //     }));

    //     // Fetch updated remaining rooms
    //     await fetchRoomData(orderRooms);
    // };
    // const handleUpdateRoomQuantities = async () => {
    //     try {
    //         // Kiểm tra số lượng có vượt quá số phòng trống hay không

    //         await fetchBookingDetails();
    //         for (const [orderRoomId, quantity] of Object.entries(updatedQuantities)) {
    //             const orderRoom = orderRooms.find(room => room._id === orderRoomId);
    //             const remainingRoom = remainingRooms[orderRoom.roomCateId._id]; // Số phòng còn lại cho phòng này
    //             console.log(remainingRoom, remainingRoom + orderRoom.quantity);

    //             if (quantity > remainingRoom + orderRoom.quantity) {
    //                 // Lưu thông báo lỗi cho phòng này
    //                 setQuantityError((prevErrors) => ({
    //                     ...prevErrors,
    //                     [orderRoomId]: "Số lượng phòng đã vượt quá số phòng còn lại!", // Lỗi cho phòng cụ thể
    //                 }));
    //                 return; // Dừng lại nếu có lỗi, không gửi yêu cầu PUT
    //             }


    //             const priceDifference = calculateTotalPrice();
    //             // Cập nhật giá tổng của booking
    //             const bookingId = orderRooms[0]?.bookingId?._id;
    //             await axios.put(`http://localhost:9999/bookings/${bookingId}`, { price: orderRooms[0].bookingId.price + priceDifference, note: note });

    //             await axios.post('http://localhost:9999/histories/BE', { bookingId: bookingId, staffId: staff._id, note: `${staff.role} ${staff.fullname} đã cập nhật thông tin phòng` });


    //             // Xóa lỗi nếu số lượng hợp lệ
    //             setQuantityError((prevErrors) => {
    //                 const { [orderRoomId]: removedError, ...rest } = prevErrors;  // Xóa lỗi cho phòng này nếu hợp lệ
    //                 return rest;
    //             });
    //         }

    //         // Nếu không có lỗi, tiếp tục gọi API để cập nhật số lượng
    //         for (const [orderRoomId, quantity] of Object.entries(updatedQuantities)) {
    //             await axios.put(`http://localhost:9999/orderRooms/${orderRoomId}`, { quantity });
    //         }
    //         // Làm mới dữ liệu
    //         fetchBookingDetails();

    //         // Reset số lượng đã cập nhật
    //         setUpdatedQuantities({});
    //         toast.success('Cập nhật số lượng phòng , ghi chú và giá thành công.', {
    //             position: "top-right",
    //         });
    //         // Có thể thêm thông báo thành công hoặc xử lý khác sau khi cập nhật xong
    //         console.log("Số lượng phòng đã được cập nhật thành công!");
    //     } catch (error) {
    //         console.error('Lỗi khi cập nhật số lượng phòng:', error);
    //     }
    // };

    const calculateTotalPrice = () => {
        // Lấy giá cũ của tất cả orderRooms (tính theo từng phòng)
        const oldPrice = orderRooms.reduce((total, orderRoom) => {
            const roomPrice = orderRoom.roomCateId?.price || 0;
            const quantity = orderRoom.quantity;

            const receiveDate = new Date(orderRoom.receiveRoom);
            const returnDate = new Date(orderRoom.returnRoom);
            const numberOfNights = Math.max(1, Math.ceil((returnDate - receiveDate) / (1000 * 60 * 60 * 24)));

            return total + roomPrice * quantity * numberOfNights;
        }, 0);

        // Tính giá mới từ số lượng phòng đã được cập nhật
        const newPrice = orderRooms.reduce((total, orderRoom) => {
            const roomPrice = orderRoom.roomCateId?.price || 0;
            const quantity = updatedQuantities[orderRoom._id] ?? orderRoom.quantity;

            const receiveDate = new Date(orderRoom.receiveRoom);
            const returnDate = new Date(orderRoom.returnRoom);
            const numberOfNights = Math.max(1, Math.ceil((returnDate - receiveDate) / (1000 * 60 * 60 * 24)));

            return total + roomPrice * quantity * numberOfNights;
        }, 0);

        // Tính chênh lệch giữa giá cũ và giá mới
        const priceDifference = newPrice - oldPrice;

        return priceDifference; // Trả về chênh lệch giá
    };



    // Hàm để hiển thị nội dung ghi chú
    const renderNote = (note, id) => {
        if (!note) return 'N/A';
        const isExpanded = expandedNotes[id];
        const shortNote = note.length > 100 ? `${note.substring(0, 100)}...` : note;
        return (
            <>
                {isExpanded ? note : shortNote}
                {note.length > 100 && (
                    <button
                        onClick={() => toggleNote(id)}
                        style={{
                            marginLeft: '10px',
                            background: 'none',
                            border: 'none',
                            color: '#007bff',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                        }}
                    >
                        {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                    </button>
                )}
            </>
        );
    };
    // Handler for service total changes
    const handleServiceTotalChange = (total) => {
        setNewBookingPrice(total + orderRooms[0].bookingId?.price || 0);
    };

    // Hàm cập nhật thông tin dịch vụ và giá booking
    const handleUpdateBooking = async () => {
        setIsUpdating(true);
        try {
            const createService = await addServiceRef.current.addService(bookingId);
            if (createService) {
                const updatedBookingData = {
                    price: newBookingPrice || orderRooms[0].bookingId.price, // Cập nhật giá nếu có thay đổi
                };
                if (updatedBookingData.price !== orderRooms[0].bookingId.price) {
                    // Cập nhật giá booking và dịch vụ
                    await axios.put(`${BASE_URL}/bookings/${bookingId}`, updatedBookingData);

                    await axios.post(`${BASE_URL}/histories/BE`, { bookingId: bookingId, staffId: staff._id, note: `${staff.role} ${staff.fullname} đã thêm dịch vụ` });
                    const newNotification = { content: `${bookingId} ${staff.fullname} đã thêm dịch vụ`, locationId: locationId };
                    axios
                        .post(`${BASE_URL}/chats/send`, newNotification)
                        .then((response) => {
                            console.log(response.data);
                        })
                        .catch((error) => {
                            console.error(error);
                        });

                    toast.success('Thông tin dịch vụ và giá đơn đã được cập nhật.', {
                        position: "top-right",
                    });
                    fetchBookingDetails(); // Tải lại thông tin booking sau khi cập nhật
                } else {
                    toast.error('Vui lòng thêm dịch vụ.', {
                        position: "top-right",
                    });
                }
            }
            else {
                toast.error('Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.', {
                    position: "top-right",
                });
            }

        } catch (error) {
            console.error('Error updating booking data:', error);
            toast.error('Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.', {
                position: "top-right",
            });
        } finally {
            setIsUpdating(false);
        }
    };


    // Xử lý check-out
    const handleCheckout = async () => {
        setIsUpdating(true);
        try {
            // const updatePay = await axios.put(`http://localhost:9999/payment/booking/${bookingId}`, { amount: orderRooms[0].bookingId.price, status: 'confirm' });
            // if (!updatePay.data.success) {
            //     const paymentResponse = await axios.post(`http://localhost:9999/payment/create-payment`, {
            //         amount: orderRooms[0].bookingId.price,
            //         bookingId: bookingId,
            //         status: 'confirm'
            //     });
            // }
            await axios.put(`${BASE_URL}/bookings/${bookingId}`, { status: 'Đã hoàn thành', payment: newBookingPrice });

            for (const room of Rooms) {
                // Gửi yêu cầu PUT để cập nhật trạng thái
                await axios.put(`${BASE_URL}/rooms/${room._id}`, { status: 'Trống', bookingId: null });
                console.log(`Room ${room.code} updated to 'Trống'`);
            }
            console.log('Tất cả các phòng đã được cập nhật thành công!');
            // Cập nhật trạng thái booking
            setOrderRooms((prevOrderRooms) =>
                prevOrderRooms.map((orderRoom) => ({
                    ...orderRoom,
                    bookingId: { ...orderRoom.bookingId, status: 'Đã hoàn thành' },
                }))
            );


            const newNotification = { content: "Đơn phòng đã hoàn thành", locationId: location };
            axios
                .post(`${BASE_URL}/chats/send`, newNotification)
                .then((response) => {
                    console.log(response.data);
                })

            await axios.post(`${BASE_URL}/histories/BE`, { bookingId: bookingId, staffId: staff._id, note: `${staff.role} ${staff.fullname} đã check out cho khách` });
            fetchBookingDetails()
            toast.success('Check out thành Công', {
                position: "top-right",
            });
            navigate('/bookings')
        } catch (error) {
            console.error('Error updating booking status:', error);
            toast.error('Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.', {
                position: "top-right",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    if (orderRooms.length === 0) {
        return <div>Loading...</div>;
    }
    // Xử lý hủy
    const handleCancelService = async (deleteService, price) => {
        const checkinDate = new Date(deleteService?.time);
        const currentDate = new Date();
        const daysBeforeCheckin = Math.floor((checkinDate - currentDate) / (1000 * 3600 * 24));
        currentDate.setHours(0, 0, 0, 0)
        checkinDate.setHours(0, 0, 0, 0)

        // Kiểm tra nếu dịch vụ được hủy trước ngày check-in 2 ngày
        if (daysBeforeCheckin >= 2) {
            if (window.confirm('Bạn có chắc muốn hủy dịch vụ này không?')) {
                // Xóa dịch vụ khỏi danh sách
                const updatedServices = orderServices.filter((service) => service._id !== deleteService._id);
                setOrderServices(updatedServices); // Cập nhật lại danh sách dịch vụ đã đặt

                // Cập nhật lại giá booking sau khi xóa dịch vụ
                setNewBookingPrice((prevPrice) => prevPrice - price);

                // Gửi yêu cầu xóa dịch vụ từ cơ sở dữ liệu
                try {
                    // Cập nhật lại booking với dịch vụ đã xóa
                    const updatedBookingData = {
                        price: orderRooms[0].bookingId.price - price || newBookingPrice,
                    };
                    await axios.put(`${BASE_URL}/bookings/${bookingId}`, updatedBookingData);
                    await axios.delete(`${BASE_URL}/orderServices/${deleteService._id}`);

                    await axios.post(`${BASE_URL}/histories/BE`, { bookingId: bookingId, staffId: staff._id, note: `${staff.role} ${staff.fullname} đã xóa dịch vụ` });
                    const newNotification = { content: `${bookingId} ${staff.fullname} đã xóa dịch vụ`, locationId: locationId };
                    axios
                        .post(`${BASE_URL}/chats/send`, newNotification)
                        .then((response) => {
                            console.log(response.data);
                        })
                        .catch((error) => {
                            console.error(error);
                        });

                    fetchBookingDetails(); // Tải lại thông tin booking sau khi cập nhật
                    toast.success('Dịch vụ đã được xóa thành công và giá đơn đã được cập nhật.', {
                        position: "top-right",
                    });

                } catch (error) {
                    console.error('Error canceling service:', error);
                    toast.error('Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.', {
                        position: "top-right",
                    });
                }
            }
        } else {
            toast.error('Dịch vụ chỉ có thể hủy trước ngày sử dụng dịch vụ 2 ngày.', {
                position: "top-right",
            });
        }
    };
    const handleDeleteOrderRoom = async (OrderRoom) => {

        const checkinDate = new Date(OrderRoom.receiveRoom);
        const checkinBooking = new Date(OrderRoom.bookingId?.checkin);
        const checkoutDate = new Date(OrderRoom.returnRoom);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0)
        checkinDate.setHours(0, 0, 0, 0)
        checkoutDate.setHours(0, 0, 0, 0)
        checkinBooking.setHours(0, 0, 0, 0)
        const daysBeforeCheckin = Math.floor((checkinBooking - currentDate) / (1000 * 3600 * 24));
        const night = Math.floor((checkoutDate - checkinDate) / (1000 * 3600 * 24));

        const price = OrderRoom.roomCateId.price * OrderRoom.quantity * night;

        // Kiểm tra nếu phòng được hủy trước ngày check-in 2 ngày
        if (daysBeforeCheckin >= 2 && orderRooms.length > 1) {
            if (window.confirm('Bạn có chắc muốn hủy phòng này không?')) {
                // Xóa phòng khỏi danh sách
                const updatedRooms = orderRooms.filter((room) => room._id !== OrderRoom._id);
                setOrderRooms(updatedRooms); // Cập nhật lại danh sách phòng đã đặt

                // Cập nhật lại giá booking sau khi xóa phòng
                setNewBookingPrice((prevPrice) => prevPrice - price);

                // Gửi yêu cầu xóa phòng từ cơ sở dữ liệu
                try {
                    // Cập nhật lại booking với Room đã xóa
                    const updatedBookingData = {
                        price: OrderRoom.bookingId.price - price || newBookingPrice,
                    };
                    await axios.put(`${BASE_URL}/bookings/${bookingId}`, updatedBookingData);

                    // Gửi yêu cầu API để hủy phòng
                    await axios.delete(`${BASE_URL}/orderRooms/${OrderRoom._id}`)

                    await axios.post(`${BASE_URL}/histories/BE`, { bookingId: bookingId, staffId: staff._id, note: `${staff.role} ${staff.fullname} đã xóa phòng` });
                    const newNotification = { content: `${bookingId} ${staff.fullname} đã hủy loại phòng`, locationId: locationId };
                    axios
                        .post(`${BASE_URL}/chats/send`, newNotification)
                        .then((response) => {
                            console.log(response.data);
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                    fetchBookingDetails(); // Tải lại thông tin booking sau khi cập nhật
                    toast.success('Phòng  đã được xóa thành công và giá booking đã được cập nhật.', {
                        position: "top-right",
                    });

                } catch (error) {
                    console.error('Lỗi khi hủy phòng:', error);
                    toast.error('Không thể hủy phòng. Vui lòng thử lại.', {
                        position: "top-right",
                    });
                }
            };
        } else {
            if (orderRooms.length === 1) {
                toast.error('Phòng chỉ có thể xóa Khi còn trên 1 loại phòng.', {
                    position: "top-right",
                });
            }
            else {
                toast.error('Phòng chỉ có thể xóa trước ngày check in 2 ngày.', {
                    position: "top-right",
                });
            };
        }
    }

    const handleUpdateRoomAll = async () => {
        try {
            // Gọi hàm để tạo order rooms và nhận về tổng giá từ result
            const result = await roomCategoriesRef.current.createAgencyOrderRoom(orderRooms[0]?.bookingId?.price);

            if (result.success) {  // Cập nhật từng orderRoom với số lượng mới

                //     for (const [orderRoomId, quantity] of Object.entries(updatedQuantities)) {
                //         await axios.put(`http://localhost:9999/orderRooms/${orderRoomId}`, { quantity });
                //     }


                //     // Tính tổng giá chênh lệch
                //     const priceDifference = calculateTotalPrice();

                //     // Cập nhật giá tổng của booking
                //     const bookingId = orderRooms[0]?.bookingId?._id;
                //     await axios.put(`http://localhost:9999/bookings/${bookingId}`, { price: orderRooms[0].bookingId.price + priceDifference + result.totalAmount, note: note });

                await axios.put(`${BASE_URL}/bookings/${bookingId}`, { price: orderRooms[0].bookingId.price + result.totalAmount, note: note });

                await axios.post(`${BASE_URL}/histories/BE`, { bookingId: bookingId, staffId: staff._id, note: `${staff.role} ${staff.fullname} đã cập nhật thông tin phòng` });
                const newNotification = { content: `${bookingId} ${staff.fullname} đã cập nhật thông tin phòng mới`, locationId: locationId };
                axios
                    .post(`${BASE_URL}/chats/send`, newNotification)
                    .then((response) => {
                        console.log(response.data);
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                // Làm mới dữ liệu
                fetchBookingDetails();
                await roomCategoriesRef.current.fetchRoomData()
                // Reset số lượng đã cập nhật
                setUpdatedQuantities({});
                toast.success('Cập nhật số lượng phòng , ghi chú và giá thành công.', {
                    position: "top-right",
                });
            } else {
                toast.error('Có lỗi xảy ra. Vui lòng thử lại.', {
                    position: "top-right",
                });
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật:', error);
            toast.error('Có lỗi xảy ra. Vui lòng thử lại.', {
                position: "top-right",
            });

        }
    };


    // const handleContractChange = (e) => setContractCode(e.target.value); // Xử lý thay đổi mã hợp đồng
    // const handlePriceChange = (e) => setPrice(e.target.value); // Xử lý thay đổi giá cả
    const handleChangeByAdmin = (e) => {
        const { id, value } = e.target;

        if (id === "contractCode") {
            // Ensure contract code is alphanumeric, not empty, and under 30 characters
            const isValid = /^[a-zA-Z0-9]*$/.test(value);
            if (value.length > 30) {
                toast.error("Mã hợp đồng không được vượt quá 30 ký tự.", {
                    position: "top-right",
                });
            } else if (!isValid) {
                toast.error(
                    "Mã hợp đồng chỉ được chứa ký tự chữ và số, không chứa khoảng trắng hoặc ký tự đặc biệt.",
                    { position: "top-right" }
                );
            } else {
                setContractCode(value);
            }
        } else if (id === "price") {
            // Allow empty or positive numbers
            if (value === "") {
                setPrice(""); // Allow empty value
            } else if (Number(value) < 0) {
                toast.error("Tổng giá để trống hoặc lớn hơn hoặc bằng 0.", {
                    position: "top-right",
                });
            } else {
                setPrice(Number(value)); // Set valid positive number
            }
        }
    };



    const handleCheckoutAndUpService = () => {
        if (newBookingPrice !== orderRooms[0].bookingId.price) {
            handleUpdateBooking()
        }
        handleConfirmCheckout()
    }

    const handleSave = async () => {
        try {
            // Prepare the update data
            const bookingId = orderRooms[0]?.bookingId?._id;
            const updateData = { contract: contractCode };

            // Only include price if it's not an empty string
            if (price !== "") {
                updateData.price = price;
            }

            // Update booking information
            await axios.put(`${BASE_URL}/bookings/${bookingId}`, updateData);

            // Log the update in history
            await axios.post(`${BASE_URL}/histories/BE`, {
                bookingId: bookingId,
                staffId: staff._id,
                note: `${staff.role} ${staff.fullname} đã cập nhật thông tin `,
            });
            // Fetch updated booking details
            fetchBookingDetails();

            // Reset state
            setContractCode(updateData.contract || '');
            setPrice(updateData.price || '');



            toast.success('Cập nhật số mã hợp đồng và giá thành công.', {
                position: "top-right",
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật:', error);
            toast.error('Có lỗi xảy ra. Vui lòng thử lại.', {
                position: "top-right",
            });
        }
    };

    const handleBackToList = () => {
        navigate('/bookings')
    };
    const handleOpenModal = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleConfirmCheckout = () => {
        if (newBookingPrice !== orderRooms[0].bookingId.price) {
            handleUpdateBooking()
        }
        setShowModal(false);
        handleCheckout(); // Thực hiện hành động Check-out
    };

    return (
        <div className="booking-details">
            <ToastContainer />
            <h2>Thông tin Đặt phòng {!refundTimeOut && <span className='text-danger'>Đã hết thời gian hủy đơn và cập nhật phòng</span>}</h2>
            <div>
                <h3>
                    Mã Đặt phòng: {orderRooms[0]?.bookingId?._id || "N/A"} - Mã hợp đồng:{" "}
                    {orderRooms[0]?.bookingId?.contract || "N/A"}
                </h3>

                {(staff.role === 'admin' && (orderRooms[0].bookingId?.status === 'Đã check-in' || orderRooms[0].bookingId?.status === 'Đã đặt')) && (
                    <Form>
                        <Row className="mb-3">
                            {/* Input mã hợp đồng */}
                            <Form.Group
                                as={Col}
                                controlId="contractCode"
                                className="d-flex justify-content-evenly align-content-center"
                            >
                                <Form.Label className="align-content-center">
                                    <strong>Mã Hợp Đồng : </strong>
                                </Form.Label>
                                <Form.Control
                                    className="w-75"
                                    type="text"
                                    placeholder="Nhập mã hợp đồng"
                                    value={contractCode}
                                    onChange={handleChangeByAdmin} // Unified handler
                                    required
                                />
                            </Form.Group>

                            {/* Input giá cả */}
                            <Form.Group
                                as={Col}
                                controlId="price"
                                className="d-flex justify-content-evenly align-content-center"
                            >
                                <Form.Label className="align-content-center">
                                    <strong>Tổng giá :</strong>
                                </Form.Label>
                                <Form.Control
                                    className="w-75"
                                    type="number"
                                    placeholder="Nhập giá cả"
                                    value={price}
                                    onChange={handleChangeByAdmin} // Unified handler
                                />
                            </Form.Group>

                            {/* Nút lưu */}
                            <Col className="align-content-center">
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        if (!contractCode) {
                                            toast.error("Mã hợp đồng không được để trống.", {
                                                position: "top-right",
                                            });
                                            return;
                                        }
                                        handleSave();
                                    }}
                                >
                                    Lưu
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                )}
            </div>


            <Row className="customer-info">
                <h4>Thông tin Khách hàng</h4>
                <Col>
                    <p><strong>Họ và tên:</strong> {orderRooms[0].customerId?.fullname || 'N/A'}</p>
                    <p><strong>Email:</strong> {orderRooms[0].customerId?.email || 'N/A'}</p>
                    <p><strong>Số điện thoại:</strong> {orderRooms[0].customerId?.phone || 'N/A'}</p>
                    <p><strong>Check-in:</strong> {format(new Date(orderRooms[0].bookingId?.checkin), 'dd-MM-yyyy')}</p>
                    <p><strong>Check-out:</strong> {format(new Date(orderRooms[0].bookingId?.checkout), 'dd-MM-yyyy')}</p>
                </Col>
                {/* Hiển thị thông tin Agency */}
                {Agency && (
                    <Col className="agency-details">
                        <p><strong>Mã đơn vị:</strong> {Agency.code}</p>
                        <p><strong>Tên đơn vị:</strong> {Agency.name}</p>
                        <p><strong>SĐT đơn vị:</strong> {Agency.phone}</p>
                        <p><strong>Vị trí đơn vị:</strong> {Agency.address}</p>
                        <p><strong>Bank + STK:</strong> {Agency.stk}</p>
                    </Col>
                )}
                <Col>
                    <p><strong>Ngày tạo đơn:</strong> {format(new Date(orderRooms[0].createdAt), 'dd-MM-yyyy')}</p>
                    <p><strong>Tổng giá:</strong> {orderRooms[0].bookingId?.price ? `${orderRooms[0].bookingId.price} VND` : 0}</p>
                    <p><strong>Trạng thái:</strong> {orderRooms[0].bookingId?.status || 'N/A'}</p>
                    <p><strong>Đã thanh toán:</strong> {orderRooms[0].bookingId?.payment || 0}</p>
                    <p><strong>Còn nợ:</strong> {orderRooms[0].bookingId?.price - orderRooms[0].bookingId?.payment}</p>
                </Col>

            </Row>



            <section className="room-details">
                <h3>Thông tin Phòng </h3>
                <table>
                    <thead>
                        <tr>
                            <th>Tên phòng</th>
                            <th>Giá (VND)</th>
                            <th>Vị trí</th>
                            <th>Số lượng</th>
                            <th>Thời gian</th>
                            {Agency && orderRooms[0]?.bookingId?.status === 'Đã đặt' && <th>Thao tác</th>} {/* Chỉ hiển thị cột này nếu có Agency */}
                        </tr>
                    </thead>

                    <tbody>
                        {orderRooms.map((orderRoom) => (
                            <tr key={orderRoom._id}>
                                <td>{orderRoom.roomCateId?.name || 'N/A'}</td>
                                <td>{orderRoom.roomCateId?.price ? `${orderRoom.roomCateId.price} VND` : 'N/A'}</td>
                                <td>{location?.name || 'N/A'}</td>
                                <td>{orderRoom.quantity || 0}</td>

                                <td>
                                    {orderRoom?.receiveRoom
                                        ? format(new Date(orderRoom.receiveRoom), 'dd-MM-yyyy')
                                        : 'N/A'}{' '}
                                    {' => '}
                                    {orderRoom?.returnRoom
                                        ? format(new Date(orderRoom.returnRoom), 'dd-MM-yyyy')
                                        : 'N/A'}
                                </td>

                                {Agency && orderRooms[0]?.bookingId?.status === 'Đã đặt' && (
                                    <td>
                                        <button onClick={() => handleDeleteOrderRoom(orderRoom)}>Xóa</button>
                                    </td>
                                )}
                            </tr>
                        ))}

                    </tbody>
                </table>
                {/* <h3>Tổng giá: {calculateTotalPrice().toLocaleString()} VND</h3> */}

            </section>

            <section className="booking-info">
                <p><strong>Ghi chú:</strong> {renderNote(orderRooms[0].bookingId?.note) || 'N/A'}</p>
            </section>

            {orderRooms[0]?.bookingId?.status === 'Đã check-in' &&
                <Row>
                    {Rooms.map((room) => (
                        <Col md={2} key={room._id} >
                            <Card>
                                <Card.Body>
                                    <Card.Title>{room.roomCategoryId?.name || 'N/A'}</Card.Title>
                                    <Card.Text>
                                        <strong>Số phòng:</strong> {room?.code || 'N/A'}
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>}

            {(Agency && orderRooms[0]?.bookingId?.status === 'Đã đặt' && refundTimeOut) &&
                <section>


                    <h3>
                        Tạo mới & Cập nhật ghi chú (
                        <strong>
                            Check-In: {orderRooms[0].bookingId?.checkin ? format(new Date(orderRooms[0].bookingId?.checkin), 'dd-MM-yyyy') : "N/A"}
                            <span > <FaArrowRight /></span>   {/* Use the right arrow icon */}
                            Check-Out: {orderRooms[0].bookingId?.checkout ? format(new Date(orderRooms[0].bookingId?.checkout), 'dd-MM-yyyy') : "N/A"}
                        </strong>)
                    </h3>

                    <UpdateAgencyOrder
                        ref={roomCategoriesRef}
                        customerID={orderRooms[0].customerId._id}
                        locationId={location._id}
                        bookingId={orderRooms[0].bookingId._id}
                        checkinDate={orderRooms[0].bookingId.checkin}
                        checkoutDate={orderRooms[0].bookingId.checkout}
                    />
                    {/* Note Input Field */}
                    <Row className="mb-3">
                        <Col className='border rounded'>
                            <Form.Group controlId="note">
                                <Form.Label><strong>Cập nhật ghi chú đặt phòng</strong></Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Nhập ghi chú (nếu có)"
                                    name="note"
                                    value={note} // Liên kết với state
                                    onChange={(e) => setNote(e.target.value)} // Cập nhật state
                                    maxLength={700} // Giới hạn ký tự
                                />
                                <Form.Text className="text-muted">
                                    {note.length}/700 Ký tự
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Create Order Button */}
                    {/* <Button
                        variant="primary"
                        // onClick={handleUpdateRoomAll}
                        onClick={handleUpdateRoomQuantities}
                    // disabled={quantityError === null}
                    >
                        Thêm dữ liệu đặt phòng mới
                    </Button> */}
                    <Button
                        variant="primary"
                        onClick={handleUpdateRoomAll}
                    // onClick={handleUpdateRoomQuantities}
                    // disabled={quantityError === null}
                    >
                        Thêm dữ liệu đặt phòng mới
                    </Button>
                </section>}

            <section className="service-details">
                <h3>Dịch vụ Đã đặt</h3>
                {orderServices.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Tên dịch vụ</th>
                                <th>Giá (VND)</th>
                                <th>Số lượng</th>
                                <th>Ngày sử dụng</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orderServices.map((service) => (
                                <React.Fragment key={service._id}>
                                    <tr>
                                        <td>{service?.otherServiceId.name || "N/A"}</td>
                                        <td>{service.otherServiceId?.price || "N/A"}</td>
                                        <td>{service?.quantity || "N/A"}</td>
                                        <td>
                                            {(() => {
                                                const date = service.time;
                                                const formattedDate = date.replace('T', ',').split('.')[0]; // Loại bỏ phần milliseconds và thay T bằng ,
                                                const [datePart, timePart] = formattedDate.split(',');
                                                const [year, month, day] = datePart.split('-');
                                                return `${day}-${month}-${year}, ${timePart.slice(0, 5)}`; // Cắt giờ phút từ timePart
                                            })()}
                                        </td>

                                        <td>
                                            <Button
                                                variant="danger"
                                                disabled={service.status !== "Đã đặt" || (orderRooms[0].bookingId?.status !== 'Đã check-in' && orderRooms[0].bookingId?.status !== 'Đã đặt')}
                                                onClick={() => handleCancelService(service, (service.otherServiceId.price * service.quantity))}

                                            >
                                                Hủy Dịch Vụ
                                            </Button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="5">
                                            <strong>Ghi chú:</strong> {renderNote(service?.note, service._id)}
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <h3 className='text-success'>Khách hàng chưa đặt dịch vụ nào.</h3>
                )}
            </section>

            {/* Service Form */}
            {(orderRooms[0].bookingId?.status === 'Đã check-in' || orderRooms[0].bookingId?.status === 'Đã đặt') && (
                <div>
                    <AddServiceForm
                        ref={addServiceRef}
                        bookingId={bookingId} // Pass booking ID after it's created
                        onServiceTotalChange={handleServiceTotalChange} // Callback for service total
                        extrafee={true}
                        canUpdate={true}
                        bookingCheckIn={orderRooms[0].bookingId.checkin}
                        bookingCheckOut={orderRooms[0].bookingId.checkout}
                        locationId={location}
                    />
                    <Button onClick={handleUpdateBooking}
                        disabled={isUpdating || (orderRooms[0].bookingId?.status !== 'Đã check-in' && orderRooms[0].bookingId?.status !== 'Đã đặt')}

                    >
                        {isUpdating ? 'Đang cập nhật...' : 'Cập nhật Dịch vụ'}
                    </Button>
                </div>


            )}


            {/* <h3>Tổng giá tiền thay đổi thành: {newBookingPrice}</h3> */}
            <div className="checkout-button mt-4">


                {/* <button
                    onClick={handleCheckout}
                    disabled={isUpdating || orderRooms[0].bookingId?.status !== 'Đã check-in'}

                >
                    {isUpdating ? 'Đang cập nhật...' : 'Xác nhận Check-out'}
                </button> */}
                {/* Nút Back */}
                <Button
                    className='mx-2'
                    onClick={handleBackToList}
                    variant="warning"
                >
                    Về danh sách đặt phòng
                </Button>
                {/* Nút Check-out */}
                <Button
                    onClick={handleOpenModal}
                    disabled={isUpdating || orderRooms[0].bookingId?.status !== 'Đã check-in'}
                    variant="primary"
                >
                    {isUpdating ? 'Đang cập nhật...' : 'Xác nhận Check-out'}
                </Button>


                {/* Modal */}
                <Modal show={showModal} onHide={handleCloseModal} centered className="custom-modal">
                    <Modal.Header closeButton className="text-center">
                        <Modal.Title>Thông tin Check-out</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="text-center custom-modal-body">
                        <p><strong>Tổng giá:</strong> {newBookingPrice || 0} VND</p>
                        {/* <p><strong>Tổng giá:</strong> {orderRooms[0].bookingId?.price ? `${orderRooms[0].bookingId.price} VND` : 'N/A'}</p> */}
                        <p><strong>Đã thanh toán:</strong> {orderRooms[0].bookingId?.payment || 0} VND</p>
                        <p><strong>Còn nợ:</strong> {newBookingPrice - orderRooms[0].bookingId?.payment} VND</p>
                    </Modal.Body>
                    <Modal.Footer className="justify-content-center">
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Hủy bỏ
                        </Button>
                        <Button variant="primary"
                            //  onClick={handleConfirmCheckout}>
                            onClick={handleCheckoutAndUpService}>
                            Xác nhận Check-out
                        </Button>
                    </Modal.Footer>
                </Modal>
                {staff.role === 'admin' && (
                    <Button
                        variant="info"
                        style={{ margin: ' 0px 10px' }}
                        onClick={() => {
                            navigate('/historyBookingChange', { state: { bookingId: orderRooms[0].bookingId._id } }); // Chuyển hướng với bookingId
                        }}
                    >
                        Lịch sử
                    </Button>
                )}

            </div>
        </div>
    );
};
export default BookingDetails;
