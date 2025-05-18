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
         /* Responsive card styles */
          .feature-section {
            display: flex;
            align-items: center;
            min-height: 30vh;
          }
          .btn {
            background-color: #008080 !important;
            border-radius: 5px !important;
            border: none !important;
          }
          
          /* Header with SVG wave */
          .header-wrapper {
            position: relative;
            background-color: #008080;
                      }
          
          .header-content {
            padding: 3rem 1rem;
            position: relative;
            z-index: 3;
            
          }
          
          .wave-container {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            overflow: hidden;
            line-height: 0;
            z-index: 2;
          }
          
          /* Mobile styles */
          @media (max-width: 576px) {
            .responsive-card {
              height: auto !important;
              min-height: 120px !important;
              margin-bottom: 1.5rem;
              overflow: visible !important; /* Prevent icon clipping */
            }
              img {
              width: 100% !important;
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
            .header-content {
              padding: 2rem 1rem 4rem;
            }
            .header-wrapper {
              height: 200px;
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

            img {
              width: 100% !important;
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
            .header-content {
              padding: 2.5rem 1rem 5rem;
            }
            .header-wrapper {
              height: 230px;
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
            .header-content {
              padding: 3rem 1rem 6rem;
            }
               .header-wrapper {
              height: 250px;
            }
          }
        `}
      </style>

      {/* Header Section with SVG Wave */}
      <div className="header-wrapper text-white text-center">
        <div className="header-content">
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
          </Container>
        </div>
        <div className="wave-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path fill="#ffffff" fillOpacity="1" d="M0,256L80,245.3C160,235,320,213,480,224C640,235,800,277,960,256C1120,235,1280,149,1360,106.7L1440,64L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
          </svg>
        </div>
      </div>

      <Container>
        <img src="landing-page.png" alt="Landing Page" className="img-fluid mx-auto d-block" style={{ width: '70%', height: 'auto' }} />
      </Container>

      {/* Features Section */}
      <section className="feature-section mt-2 py-4">
        <Container>
          <h2 className="text-center mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}></h2>
          <Row className="d-flex align-items-stretch">
            <Col xs={12} md={4} className="mb-4 d-flex">
              <Card className="border border-muted p-2 p-md-3 position-relative shadow-sm responsive-card w-100 text-center">
                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center feature-icon-container" style={{ width: '46px', height: '46px', zIndex: 20 }}>
                  <FaBook className="text-black" style={{ fontSize: '1.6rem' }} />
                </div>
                <Card.Body className="pt-4 d-flex flex-column justify-content-center card-body-with-icon">
                  <Card.Title as="h5" className="mb-2" style={{ fontSize: '1.1rem', color: '#008080' }}>Track Your Books</Card.Title>
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
                  <Card.Title as="h5" className="mb-2" style={{ fontSize: '1.1rem', color: '#008080' }}>View Stats</Card.Title>
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
                  <Card.Title as="h5" className="mb-2" style={{ fontSize: '1.1rem', color: '#008080' }}>Personalize Your Profile</Card.Title>
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
          <Button as={Link} to="/signup" size="lg" className="px-4">
            Sign Up Now
          </Button>
        </Container>
      </section>

      {/* Footer Section */}
      <footer className="text-center py-3 mt-auto base text-secondary">
        <Container fluid>
          <p className="mb-0">© 2025 Booksy.</p>
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;