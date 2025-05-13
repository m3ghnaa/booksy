import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaBook, FaChartLine, FaUserCircle } from 'react-icons/fa'; // Icons for features and header
import 'bootstrap/dist/css/bootstrap.min.css';

const LandingPage = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <style>
        {`
          /* Global responsive styles */
          .btn {
            border-radius: 0 !important;
            background-color: #000000 !important;
            border-color: #000000 !important;
          }
          .btn-outline-light {
            color: #ffffff !important;
            background-color: transparent !important;
            border-color: #ffffff !important;
          }
          .btn-light {
            color: #000000 !important;
            background-color: #ffffff !important;
            border-color: #ffffff !important;
          }
          .btn-primary {
            color: #ffffff !important;
          }
          
          /* Responsive card styles */
          .feature-section {
            display: flex;
            align-items: center;
            min-height: 50vh;
          }
          
          /* Mobile styles */
          @media (max-width: 576px) {
            .responsive-card {
              height: auto !important;
              min-height: 120px !important;
              margin-bottom: 1.5rem;
              overflow: visible !important; /* Prevent icon clipping */
            }
            .responsive-card h5 {
              font-size: 1rem !important;
            }
            .responsive-card p {
              font-size: 1rem !important;
            }
            .header-title {
              font-size: 1.5rem !important;
            }
            .header-title-text {
              white-space: nowrap;
            }
            .header-subtitle {
              font-size: 1rem !important;
            }
            .cta-buttons {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .cta-buttons .btn {
              margin: 0.5rem 0 !important;
              width: 80%;
            }
            .feature-icon-container {
              width: 50px !important;
              height: 50px !important;
              z-index: 20 !important;
              position: absolute !important;
              top: -25px !important; /* Position the icon fully above the card */
              left: 50% !important;
              margin-left: -25px !important;
            }
            .card-body-with-icon {
              padding-top: 35px !important; /* Increased to accommodate icon */
              position: relative !important;
            }
          }
          
          /* Tablet styles */
          @media (min-width: 576px) and (max-width: 768px) {
            .responsive-card {
              height: auto !important;
              min-height: 150px !important; /* Increased for medium screens */
              margin-bottom: 1.5rem;
              overflow: visible !important; /* Prevent icon clipping */
            }
            .responsive-card h5 {
              font-size: 1.05rem !important;
            }
            .responsive-card p {
              font-size: 1.05rem !important;
            }
            .header-title {
              font-size: 1.8rem !important;
            }
            .feature-section {
              min-height: 60vh !important; /* Increased to fill more space */
            }
            .feature-icon-container {
              width: 50px !important;
              height: 50px !important;
              position: absolute !important;
              top: -25px !important;
              left: 50% !important;
              margin-left: -25px !important;
            }
            .card-body-with-icon {
              padding-top: 35px !important;
            }
          }
          
          /* Larger screens */
          @media (min-width: 769px) {
            .responsive-card {
              height: 100% !important;
              min-height: 200px !important;
              overflow: visible !important; /* Prevent icon clipping */
            }
            .feature-icon-container {
              width: 46px !important;
              height: 46px !important;
              position: absolute !important;
              top: -23px !important;
              left: 50% !important;
              margin-left: -23px !important;
            }
            .card-body-with-icon {
              padding-top: 30px !important;
            }
          }
        `}
      </style>

      {/* Header Section */}
      <header className="text-white text-center py-5 px-4 shadow-sm" style={{ backgroundColor: '#000000', borderBottom: '1px solid #ffffff' }}>
        <Container>
          <h3 className="fw-bold header-title" style={{ fontFamily: "'Cinzel', serif", color: '#ffffff' }}>
            <div className="d-flex align-items-center justify-content-center">
              <FaBook className="me-2" style={{ color: '#ffffff' }} size={30} />
              <span className="header-title-text">Welcome to Booksy</span>
            </div>
          </h3>
          <p className="text-white header-subtitle pt-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Your ultimate book management companion
          </p>
          <div className="mt-4 cta-buttons">
            <Button as={Link} to="/login" variant="light" size="lg" className="mx-2 my-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Login
            </Button>
            <Button as={Link} to="/signup" variant="outline-light" size="lg" className="mx-2 my-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Sign Up
            </Button>
          </div>
        </Container>
      </header>

      {/* Features Section */}
      <section className="py-5 feature-section mt-5">
        <Container>
            <h2 className="text-center mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}></h2>
          <Row className="d-flex align-items-stretch">
            <Col xs={12} md={4} className="mb-4 d-flex">
              <Card className="border border-muted p-2 p-md-3 position-relative shadow-sm responsive-card w-100 text-center">
                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center feature-icon-container" style={{ width: '46px', height: '46px', zIndex: 20 }}>
                  <FaBook className="text-black" style={{ fontSize: '1.6rem' }} />
                </div>
                <Card.Body className="pt-4 d-flex flex-column justify-content-center card-body-with-icon">
                  <Card.Title as="h5" className="text-muted mb-1" style={{ fontSize: '1.1rem' }}>Track Your Books</Card.Title>
                  <Card.Text className="text-muted" style={{ fontSize: '0.9rem' }}>
                    Easily add, manage, and track all the books you're reading or plan to read.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4} className="mb-4 d-flex">
              <Card className="border border-muted p-2 p-md-3 position-relative shadow-sm responsive-card w-100 text-center">
                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center feature-icon-container" style={{ width: '46px', height: '46px', zIndex: 20 }}>
                  <FaChartLine className="text-black" style={{ fontSize: '1.6rem' }} />
                </div>
                <Card.Body className="pt-4 d-flex flex-column justify-content-center card-body-with-icon">
                  <Card.Title as="h5" className="text-muted mb-1" style={{ fontSize: '1.1rem' }}>View Stats</Card.Title>
                  <Card.Text className="text-muted" style={{ fontSize: '0.9rem' }}>
                    Get insights into your reading habits with detailed statistics and charts.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4} className="mb-4 d-flex">
              <Card className="border border-muted p-2 p-md-3 position-relative shadow-sm responsive-card w-100 text-center">
                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center feature-icon-container" style={{ width: '46px', height: '46px', zIndex: 20 }}>
                  <FaUserCircle className="text-black" style={{ fontSize: '1.6rem' }} />
                </div>
                <Card.Body className="pt-4 d-flex flex-column justify-content-center card-body-with-icon">
                  <Card.Title as="h5" className="text-muted mb-1" style={{ fontSize: '1.1rem' }}>Personalize Your Profile</Card.Title>
                  <Card.Text className="text-muted" style={{ fontSize: '0.9rem' }}>
                    Upload an avatar and customize your settings to make Booksy your own.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Call to Action Section */}
      <section className="bg-light py-5 text-center">
        <Container>
          <h3 className="mb-3">Get Started Today!</h3>
          <p className="text-muted mb-4">Discover a smarter way to track, analyze, and personalize your reading experience with Booksy!</p>
          <Button as={Link} to="/signup" variant="primary" size="lg" className="px-4">
            Sign Up Now
          </Button>
        </Container>
      </section>

      {/* Footer Section */}
      <footer className="bg-dark text-white text-center py-3 mt-auto">
        <Container fluid>
          <p className="mb-0">© 2025 Booksy.</p>
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;