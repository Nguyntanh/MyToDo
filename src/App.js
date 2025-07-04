import axios from 'axios';
import moment from 'moment-timezone';
import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL;
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

export default function App() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [email, setEmail] = useState('');
  const [tasks, setTasks] = useState([]);
  const [userTimezone, setUserTimezone] = useState(moment.tz.guess() || 'Asia/Ho_Chi_Minh');
  const [editTask, setEditTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      if (!API_URL) {
        throw new Error('REACT_APP_API_URL không được định nghĩa trong .env');
      }
      const response = await axios.get(API_URL);
      setTasks(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách công việc:', error.message);
      toast.error(`Không thể lấy danh sách công việc: ${error.message}`);
    }
  };

  const createTask = async () => {
    if (!title || !description || !dueDate || !email) {
      toast.error('Vui lòng điền đầy đủ các trường');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Email không hợp lệ');
      return;
    }
    try {
      const parsedDueDate = moment.tz(dueDate, 'YYYY-MM-DD HH:mm', userTimezone);
      if (!parsedDueDate.isValid()) {
        toast.error('Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD HH:mm');
        return;
      }
      const utcDueDate = parsedDueDate.toISOString();
      await axios.post(API_URL, {
        title,
        description,
        dueDate: utcDueDate,
        email,
        timezone: userTimezone,
      });
      toast.success('Công việc đã được tạo');
      setTitle('');
      setDescription('');
      setDueDate('');
      setEmail('');
      fetchTasks();
    } catch (error) {
      console.error('Lỗi khi tạo công việc:', error.message);
      toast.error(`Không thể tạo công việc: ${error.message}`);
    }
  };

  const updateTask = async () => {
    if (!editTask || !title || !description || !dueDate || !email) {
      toast.error('Vui lòng điền đầy đủ các trường');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Email không hợp lệ');
      return;
    }
    try {
      const parsedDueDate = moment.tz(dueDate, 'YYYY-MM-DD HH:mm', userTimezone);
      if (!parsedDueDate.isValid()) {
        toast.error('Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD HH:mm');
        return;
      }
      const utcDueDate = parsedDueDate.toISOString();
      await axios.put(`${API_URL}/${editTask._id}`, {
        title,
        description,
        dueDate: utcDueDate,
        email,
        timezone: userTimezone,
      });
      toast.success('Công việc đã được cập nhật');
      setEditTask(null);
      setTitle('');
      setDescription('');
      setDueDate('');
      setEmail('');
      fetchTasks();
    } catch (error) {
      console.error('Lỗi khi cập nhật công việc:', error.message);
      toast.error(`Không thể cập nhật công việc: ${error.message}`);
    }
  };

  const deleteTask = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa công việc này?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        toast.success('Công việc đã được xóa');
        fetchTasks();
      } catch (error) {
        console.error('Lỗi khi xóa công việc:', error.message);
        toast.error(`Không thể xóa công việc: ${error.message}`);
      }
    }
  };

  const startEditing = (task) => {
    setEditTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(moment(task.dueDate).tz(userTimezone).format('YYYY-MM-DD HH:mm'));
    setEmail(task.email);
  };

  // Lọc công việc sắp đến hạn để hiển thị
  const reminders = tasks.filter((task) => {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dueDate = new Date(task.dueDate);
    return dueDate >= now && dueDate <= in24Hours;
  });

  return (
    <div className="container">
      <h1 className="header">Quản lý Công việc</h1>
      <h3 className="subHeader">Múi giờ của bạn: {userTimezone}</h3>

      <div className="form">
        <input
          className="input"
          placeholder="Tiêu đề Công việc"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="input"
          placeholder="Mô tả Công việc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className="input"
          type="text"
          placeholder="Ngày hết hạn (YYYY-MM-DD HH:mm)"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {editTask ? (
          <button onClick={updateTask}>Cập nhật Công việc</button>
        ) : (
          <button onClick={createTask}>Tạo Công việc</button>
        )}
      </div>

      {reminders.length > 0 && (
        <div className="reminderSection">
          <h3 className="reminderHeader">Nhắc nhở: Công việc sắp đến hạn</h3>
          <ul className="reminderList">
            {reminders.map((item) => (
              <li key={item._id} className="reminderItem">
                <span className="taskText">{item.title}</span>
                <p>{item.description}</p>
                <p>
                  Hết hạn: {moment(item.dueDate)
                    .tz(item.timezone || userTimezone)
                    .format('YYYY-MM-DD HH:mm:ss')}
                </p>
                <p>Thời gian còn lại: {moment(item.dueDate).fromNow()}</p>
                <button
                  className="completeButton"
                  onClick={() => deleteTask(item._id)}
                >
                  Đánh dấu hoàn thành
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3 className="subHeader">Danh sách Công việc</h3>
      <ul className="taskList">
        {tasks.map((item) => (
          <li key={item._id} className="taskItem">
            <span className="taskText">{item.title}</span>
            <p>{item.description}</p>
            <p>
              Hết hạn: {moment(item.dueDate)
                .tz(item.timezone || userTimezone)
                .format('YYYY-MM-DD HH:mm:ss')}
            </p>
            <button onClick={() => startEditing(item)}>Chỉnh sửa</button>
            <button onClick={() => deleteTask(item._id)}>Xóa</button>
          </li>
        ))}
      </ul>
      <ToastContainer />
    </div>
  );
}