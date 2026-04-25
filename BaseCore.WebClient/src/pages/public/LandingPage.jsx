import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const roleCards = [
  {
    title: 'Tình nguyện viên',
    description: 'Khám phá sự kiện, đăng ký tham gia, theo dõi chứng chỉ và hành trình đóng góp.',
    icon: 'fa-hand-holding-heart',
    color: '#1b61c9',
  },
  {
    title: 'Nhà sáng lập',
    description: 'Tạo chương trình cộng đồng, quản lý người tham gia và vận hành sự kiện.',
    icon: 'fa-calendar-check',
    color: '#7c3aed',
  },
  {
    title: 'Nhà tài trợ',
    description: 'Tìm hoạt động phù hợp để đồng hành, tài trợ và theo dõi hiệu quả hỗ trợ.',
    icon: 'fa-hand-holding-dollar',
    color: '#d97706',
  },
  {
    title: 'Quản trị viên',
    description: 'Giám sát hệ thống, duyệt dữ liệu, quản lý người dùng và danh mục nền tảng.',
    icon: 'fa-shield-halved',
    color: '#dc2626',
  },
];

const features = [
  { title: 'Danh sách sự kiện', to: '/events', icon: 'fa-calendar-days' },
  { title: 'Đăng ký tham gia', to: '/login', icon: 'fa-user-plus' },
  { title: 'Quản lý chương trình', to: '/login', icon: 'fa-list-check' },
  { title: 'Tài trợ sự kiện', to: '/login', icon: 'fa-sack-dollar' },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const gatedTarget = isAuthenticated ? '/dashboard' : '/login';

  return (
    <div>
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background:
            'linear-gradient(135deg, rgba(10,37,90,0.95) 0%, rgba(27,97,201,0.88) 52%, rgba(14,165,233,0.78) 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at top right, rgba(255,255,255,0.24), transparent 32%), radial-gradient(circle at bottom left, rgba(255,255,255,0.12), transparent 26%)',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '84px 24px 92px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.16)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.18)',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <i className="fa-solid fa-leaf" />
            Nền tảng kết nối cộng đồng VolunteerHub
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-center mt-8">
            <div>
              <h1
                style={{
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 'clamp(32px, 5vw, 58px)',
                  lineHeight: 1.08,
                  marginBottom: 20,
                  maxWidth: 700,
                }}
              >
                Trang giới thiệu cho mọi vai trò trong hệ sinh thái tình nguyện
              </h1>
              <p
                style={{
                  color: 'rgba(255,255,255,0.80)',
                  fontSize: 17,
                  lineHeight: 1.7,
                  maxWidth: 620,
                  marginBottom: 32,
                }}
              >
                Người truy cập ban đầu sẽ thấy trang giới thiệu, có menu đăng ký và đăng nhập rõ ràng.
                Sau khi đăng nhập, mỗi loại tài khoản sẽ đi vào đúng giao diện riêng: tình nguyện viên,
                nhà sáng lập, nhà tài trợ hoặc quản trị viên.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/register" className="btn-primary" style={{ minWidth: 160, justifyContent: 'center' }}>
                  <i className="fa-solid fa-user-plus mr-2" />
                  Đăng ký
                </Link>
                <Link
                  to="/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 160,
                    padding: '12px 20px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.28)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: 700,
                    background: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <i className="fa-solid fa-right-to-bracket mr-2" />
                  Đăng nhập
                </Link>
                <Link
                  to="/events"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 180,
                    padding: '12px 20px',
                    borderRadius: 12,
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: 700,
                    background: 'transparent',
                  }}
                >
                  Xem sự kiện công khai
                </Link>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 28,
                padding: 24,
                backdropFilter: 'blur(14px)',
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                {roleCards.map((card) => (
                  <Link key={card.title} to={gatedTarget} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        height: '100%',
                        background: '#fff',
                        borderRadius: 20,
                        padding: 18,
                        minHeight: 180,
                        boxShadow: '0 18px 36px rgba(15,23,42,0.08)',
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 14,
                          background: `${card.color}16`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 14,
                        }}
                      >
                        <i className={`fa-solid ${card.icon}`} style={{ color: card.color, fontSize: 18 }} />
                      </div>
                      <h2 style={{ fontSize: 17, fontWeight: 700, color: '#181d26', marginBottom: 8 }}>{card.title}</h2>
                      <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(4,14,32,0.62)' }}>{card.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '44px 24px 0' }}>
        <div className="grid md:grid-cols-4 gap-4">
          {features.map((feature) => (
            <Link key={feature.title} to={feature.to} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 18,
                  padding: 20,
                  boxShadow: '0 10px 24px rgba(15,23,42,0.04)',
                  minHeight: 120,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    background: '#eef4ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                    color: '#1b61c9',
                  }}
                >
                  <i className={`fa-solid ${feature.icon}`} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#181d26', marginBottom: 6 }}>{feature.title}</h3>
                <p style={{ fontSize: 13.5, color: 'rgba(4,14,32,0.56)', lineHeight: 1.6 }}>
                  {feature.to === '/events'
                    ? 'Người dùng công khai có thể xem danh sách chương trình đang mở.'
                    : 'Nếu chưa đăng nhập, thao tác sẽ dẫn tới màn hình đăng nhập trước khi sử dụng chức năng.'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
