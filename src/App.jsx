
import { useCallback, useEffect, useState } from "react";
import {
  HashRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useUser } from "./context/UserContext";
import "./App.css";

function Layout({ children }) {
  const { user, logout, isTeacher } = useUser();
  const navigate = useNavigate();

  return (
    <div className="app">
      <header className="navbar">
        <h2>Online Course Service</h2>

        {user && (
          <nav>
            <NavLink to="/courses">Courses</NavLink>

            {!isTeacher && (
              <NavLink to="/my-courses">My Courses</NavLink>
            )}

            <span>{user.username || user.name} ({user.role})</span>

            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Logout
            </button>
          </nav>
        )}
      </header>

      <main className="container">{children}</main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useUser();

  return isAuthenticated
    ? children
    : <Navigate to="/login" replace />;
}

function Login() {
  const { login, isAuthenticated } = useUser();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/courses" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/courses");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-card">
      <h1>Login</h1>
      <p>Online Course Service</p>

      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="error">{error}</p>}

        <button disabled={loading} type="submit">
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

function CourseList() {
  const { apiRequest, isTeacher } = useUser();

  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const query = search
        ? `?search=${encodeURIComponent(search)}`
        : "";

      const data = await apiRequest(`/api/course${query}`);
      setCourses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiRequest, search]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  return (
    <div>
      <div className="page-heading">
        <h1>{isTeacher ? "My Teaching Courses" : "Available Courses"}</h1>

        {isTeacher && (
          <NavLink className="button-link" to="/courses/new">
            + Create Course
          </NavLink>
        )}
      </div>

      {!isTeacher && (
        <input
          placeholder="Search course or teacher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {error && <p className="error">{error}</p>}
      {loading && <p>Loading courses...</p>}

      {!loading && courses.length === 0 && (
        <p>No courses found.</p>
      )}

      <div className="course-grid">
        {courses.map((course) => (
          <article className="course-card" key={course._id}>
            <h2>{course.name}</h2>
            <p>Teacher: {course.teacher?.username || "Unknown"}</p>
            <p>Duration: {course.duration} days</p>
            <p>Price: {course.price}</p>
            <p>Status: {course.status}</p>
            <p>
              Seats: {course.enrolledCount}/{course.maxStudent}
            </p>

            <NavLink
              className="button-link"
              to={`/courses/${course._id}`}
            >
              View Details
            </NavLink>
          </article>
        ))}
      </div>
    </div>
  );
}

function CourseForm() {
  const { courseId } = useParams();
  const { apiRequest, isTeacher } = useUser();
  const navigate = useNavigate();

  const editing = Boolean(courseId);

  const [form, setForm] = useState({
    name: "",
    duration: 1,
    topics: "",
    price: 0,
    maxStudent: 1,
    status: "Open",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!editing || !isTeacher) return;

    apiRequest(`/api/course/${courseId}`)
      .then((data) => {
        const course = data.course;

        setForm({
          name: course.name,
          duration: course.duration,
          topics: course.topics.join(", "),
          price: course.price,
          maxStudent: course.maxStudent,
          status: course.status,
        });
      })
      .catch((err) => setError(err.message));
  }, [apiRequest, courseId, editing, isTeacher]);

  if (!isTeacher) {
    return <p className="error">Teachers only.</p>;
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = {
      name: form.name.trim(),
      duration: Number(form.duration),
      topics: form.topics
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean),
      price: Number(form.price),
      maxStudent: Number(form.maxStudent),
      status: form.status,
    };

    try {
      await apiRequest(
        editing
          ? `/api/course/${courseId}`
          : "/api/course",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify(body),
        }
      );

      navigate("/courses");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-card">
      <h1>{editing ? "Edit Course" : "Create Course"}</h1>

      <form onSubmit={submit}>
        <label>Course Name</label>
        <input
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />

        <label>Duration (days)</label>
        <input
          type="number"
          min="1"
          required
          value={form.duration}
          onChange={(e) => update("duration", e.target.value)}
        />

        <label>Topics (separate with commas)</label>
        <input
          required
          value={form.topics}
          onChange={(e) => update("topics", e.target.value)}
        />

        <label>Price</label>
        <input
          type="number"
          min="0"
          required
          value={form.price}
          onChange={(e) => update("price", e.target.value)}
        />

        <label>Max Students</label>
        <input
          type="number"
          min="1"
          required
          value={form.maxStudent}
          onChange={(e) => update("maxStudent", e.target.value)}
        />

        <label>Status</label>
        <select
          value={form.status}
          onChange={(e) => update("status", e.target.value)}
        >
          <option value="Open">Open</option>
          <option value="Close">Close</option>
          <option value="Cancel">Cancel</option>
        </select>

        {error && <p className="error">{error}</p>}

        <button disabled={loading}>
          {loading ? "Saving..." : "Save Course"}
        </button>
      </form>
    </div>
  );
}

function CourseDetails() {
  const { courseId } = useParams();
  const { apiRequest, isTeacher } = useUser();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDetails = useCallback(async () => {
    try {
      const result = await apiRequest(`/api/course/${courseId}`);
      setData(result);
    } catch (err) {
      setError(err.message);
    }
  }, [apiRequest, courseId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  async function enroll() {
    try {
      setError("");
      setMessage("");

      const result = await apiRequest("/api/enrollment", {
        method: "POST",
        body: JSON.stringify({ courseId }),
      });

      setMessage(result.message);
      await loadDetails();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteCourse() {
    if (!window.confirm("Delete this course?")) return;

    try {
      await apiRequest(`/api/course/${courseId}`, {
        method: "DELETE",
      });

      navigate("/courses");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!data) {
    return <p>{error || "Loading course details..."}</p>;
  }

  const { course, enrolledStudents, availableSeats } = data;

  return (
    <div className="detail-card">
      <h1>{course.name}</h1>
      <p>Teacher: {course.teacher?.username}</p>
      <p>Duration: {course.duration} days</p>
      <p>Topics: {course.topics.join(", ")}</p>
      <p>Price: {course.price}</p>
      <p>Status: {course.status}</p>
      <p>Available Seats: {availableSeats}</p>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      {isTeacher ? (
        <>
          <NavLink
            className="button-link"
            to={`/courses/${courseId}/edit`}
          >
            Edit Course
          </NavLink>

          <button onClick={deleteCourse}>
            Delete Course
          </button>

          <h2>Enrolled Students</h2>

          {enrolledStudents?.length === 0 && (
            <p>No students enrolled yet.</p>
          )}

          {enrolledStudents?.map((student) => (
            <p key={student._id}>
              {student.username} — {student.email}
            </p>
          ))}
        </>
      ) : (
        <button
          disabled={
            course.status !== "Open" ||
            availableSeats <= 0
          }
          onClick={enroll}
        >
          {course.status !== "Open"
            ? "Enrollment Closed"
            : availableSeats <= 0
              ? "Course Full"
              : "Enroll Now"}
        </button>
      )}
    </div>
  );
}

function MyCourses() {
  const { apiRequest, isStudent } = useUser();

  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isStudent) return;

    apiRequest("/api/enrollment")
      .then(setEnrollments)
      .catch((err) => setError(err.message));
  }, [apiRequest, isStudent]);

  if (!isStudent) {
    return <p>Students only.</p>;
  }

  return (
    <div>
      <h1>My Enrolled Courses</h1>

      {error && <p className="error">{error}</p>}

      <div className="course-grid">
        {enrollments.map((item) => (
          item.course && (
            <article className="course-card" key={item._id}>
              <h2>{item.course.name}</h2>
              <p>Teacher: {item.course.teacher?.username}</p>
              <p>Duration: {item.course.duration} days</p>
              <p>Status: {item.course.status}</p>
              <p>
                Enrolled:{" "}
                {new Date(item.enrolledAt).toLocaleDateString()}
              </p>
            </article>
          )
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <CourseList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/courses/new"
            element={
              <ProtectedRoute>
                <CourseForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/courses/:courseId"
            element={
              <ProtectedRoute>
                <CourseDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/courses/:courseId/edit"
            element={
              <ProtectedRoute>
                <CourseForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-courses"
            element={
              <ProtectedRoute>
                <MyCourses />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/courses" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
