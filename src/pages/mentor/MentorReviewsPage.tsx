import React, { useEffect, useMemo, useState } from "react";
import { reviewApi } from "../../api/reviews";
import { useAuth } from "../../contexts/AuthContext";
import type { ReviewResponseDto, ReviewUserDto } from "../../types";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { Loader2, Star, Quote, MessageSquare, Inbox } from "lucide-react";

// Hàm lấy tên hiển thị
function personLabel(u?: ReviewUserDto): string {
  if (!u) return "—";
  return (u.fullName ?? u.fullname ?? "").trim() || u.email?.trim() || "Người dùng ẩn danh";
}

// Component hiển thị Sao (Đã làm đẹp lại màu sắc)
function StarDisplay({ rating, size = 18 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }} aria-label={`${rating} trên 5 sao`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < rating ? "#f59e0b" : "#e2e8f0"}
          color={i < rating ? "#f59e0b" : "#e2e8f0"}
        />
      ))}
    </span>
  );
}

const MentorReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pageIndex, setPageIndex] = useState(1);
  const PAGE_SIZE = 10;

  // FIX LỖI: Gom logic fetch vào trong useEffect, tránh set state đồng bộ
  useEffect(() => {
    let isMounted = true;

    const fetchReviews = async () => {
      // Nếu chưa có user, dùng Promise.resolve() để tránh lỗi synchronous state update
      if (!user) {
        Promise.resolve().then(() => {
          if (isMounted) setLoading(false);
        });
        return;
      }

      if (isMounted) setLoading(true);
      if (isMounted) setError(null);

      try {
        const res = await reviewApi.getList({
          mentorId: user.id,
          pageNumber: 1,
          pageSize: 1000, // Client-side pagination, tải nhiều nhất có thể để Chart thống kê chính xác
          sortBy: "createdat",
          sorting: true,
        });

        if (!isMounted) return;

        if (res.isSuccess && res.data?.items) {
          setReviews(res.data.items as ReviewResponseDto[]);
        } else {
          setReviews([]);
          if (!res.isSuccess) setError(res.message || "Không thể tải dữ liệu đánh giá.");
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        if (isMounted) setError("Đã có lỗi kết nối xảy ra khi tải đánh giá.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReviews();

    // Cleanup function: Tránh set state khi component đã unmount
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Tính toán thống kê sao
  const stats = useMemo(() => {
    if (!reviews.length) return { avg: 0, count: 0, dist: [0, 0, 0, 0, 0] as number[] };
    const dist = [0, 0, 0, 0, 0];
    let sum = 0;
    for (const r of reviews) {
      const n = Math.min(5, Math.max(1, r.rating));
      dist[n - 1]++;
      sum += r.rating;
    }
    return { avg: sum / reviews.length, count: reviews.length, dist };
  }, [reviews]);

  const totalPages = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE));
  const displayedReviews = useMemo(() => {
    return reviews.slice((pageIndex - 1) * PAGE_SIZE, pageIndex * PAGE_SIZE);
  }, [reviews, pageIndex]);

  return (
    <div className="admin-page" style={{ paddingBottom: "3rem" }}>
      <AdminPageHeader
        eyebrow="Mentor"
        title="Đánh giá từ sinh viên"
        description="Xem nhận xét và số sao sau các buổi mentoring. Đây là dữ liệu được cung cấp trực tiếp từ trải nghiệm thực tế của sinh viên."
        actions={
          !loading && stats.count > 0 ? (
            <span
              style={{
                background: "#fef3c7",
                color: "#d97706",
                padding: "0.4rem 0.8rem",
                borderRadius: "99px",
                fontSize: "0.875rem",
                fontWeight: 600,
                border: "1px solid #fde68a",
              }}
            >
              Trung bình {stats.avg.toFixed(1)}★ ({stats.count} lượt)
            </span>
          ) : null
        }
      />

      {error && (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1rem",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#ef4444",
            borderRadius: "8px",
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "5rem 0",
            color: "#64748b",
          }}
        >
          <Loader2 className="animate-spin" size={42} color="#3b82f6" style={{ marginBottom: "1rem" }} />
          <p>Đang tải đánh giá...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px dashed #cbd5e1",
            borderRadius: "12px",
            padding: "4rem 2rem",
            textAlign: "center",
          }}
        >
          <Inbox size={50} color="#94a3b8" style={{ margin: "0 auto 1rem", opacity: 0.8 }} />
          <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>
            Chưa có đánh giá nào
          </h3>
          <p style={{ color: "#64748b", maxWidth: "400px", margin: "0 auto", fontSize: "0.95rem" }}>
            Khi sinh viên hoàn tất buổi học và gửi feedback, nội dung nhận xét sẽ hiển thị ở đây.
          </p>
        </div>
      ) : (
        <>
          {/* TỔNG QUAN ĐÁNH GIÁ UI (Làm đẹp hơn) */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              padding: "2rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "3rem",
              alignItems: "center",
              marginBottom: "2rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* Cột trái: Điểm số */}
            <div style={{ textAlign: "center", minWidth: "120px" }}>
              <div
                style={{ fontSize: "4rem", fontWeight: 800, color: "#0f172a", lineHeight: 1, marginBottom: "0.5rem" }}
              >
                {stats.avg.toFixed(1)}
              </div>
              <StarDisplay rating={Math.round(stats.avg)} size={22} />
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.75rem", fontWeight: 500 }}>
                Dựa trên {stats.count} lượt đánh giá
              </p>
            </div>

            {/* Cột phải: Thanh tiến độ phân bổ sao */}
            <div style={{ flex: 1, minWidth: "280px", maxWidth: "450px" }}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.dist[star - 1];
                const percentage = stats.count ? (count / stats.count) * 100 : 0;

                // Set màu thanh tiến độ tùy theo số sao
                let barColor = "#f59e0b"; // Vàng cho 4,5 sao
                if (star === 3) barColor = "#fbbf24"; // Vàng nhạt cho 3 sao
                if (star <= 2) barColor = "#f87171"; // Đỏ cho 1,2 sao

                return (
                  <div
                    key={star}
                    style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.6rem" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        minWidth: "40px",
                        fontSize: "0.9rem",
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      {star} <Star size={14} fill="#94a3b8" color="#94a3b8" />
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: "10px",
                        background: "#f1f5f9",
                        borderRadius: "99px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: "100%",
                          background: barColor,
                          borderRadius: "99px",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                    <span style={{ width: "30px", fontSize: "0.85rem", color: "#64748b", textAlign: "right" }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DANH SÁCH REVIEW (Dạng Card nổi bật) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {displayedReviews.map((r) => {
              return (
                <div
                  key={r.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                    display: "flex",
                    gap: "1.25rem",
                    alignItems: "flex-start",
                  }}
                >
                  {/* Avatar Sinh viên */}
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "1.25rem",
                      flexShrink: 0,
                      overflow: "hidden",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    {r.mentee?.avatarUrl ? (
                      <img
                        src={r.mentee.avatarUrl}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      personLabel(r.mentee).charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Nội dung đánh giá */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div>
                        <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "1.05rem", fontWeight: 650, color: "#1e293b" }}>
                          {personLabel(r.mentee)}
                        </h4>
                        <StarDisplay rating={r.rating} size={16} />
                      </div>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontSize: "0.8rem",
                          color: "#64748b",
                          background: "#f8fafc",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <MessageSquare size={13} />
                        Mã đặt lịch: {r.bookingId.substring(0, 8).toUpperCase()}
                      </span>
                    </div>

                    {/* Lời nhắn */}
                    <div style={{ marginTop: "1rem" }}>
                      {r.comment ? (
                        <div
                          style={{
                            background: "#f8fafc",
                            borderLeft: "4px solid #cbd5e1",
                            padding: "1rem",
                            borderRadius: "0 8px 8px 0",
                          }}
                        >
                          <Quote size={16} color="#94a3b8" style={{ marginBottom: "0.5rem" }} />
                          <p
                            style={{
                              margin: 0,
                              color: "#334155",
                              whiteSpace: "pre-wrap",
                              lineHeight: 1.6,
                              fontSize: "0.95rem",
                            }}
                          >
                            {r.comment}
                          </p>
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: "0.9rem", color: "#94a3b8", fontStyle: "italic" }}>
                          (Sinh viên đánh giá sao, không để lại nhận xét)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem', marginBottom: '2rem', gap: '1.5rem', alignItems: 'center' }}>
               <button
                   onClick={() => {
                       setPageIndex((p) => Math.max(1, p - 1));
                       window.scrollTo({ top: 0, behavior: 'smooth' });
                   }}
                   disabled={pageIndex === 1}
                   style={{ padding: '0.6rem 1.2rem', background: pageIndex === 1 ? '#cbd5e1' : '#f1f5f9', color: pageIndex === 1 ? '#64748b' : '#334155', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: pageIndex === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
               >
                   Trang trước
               </button>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.05rem', fontWeight: 600, color: '#475569' }}>
                   Trang
                   <input
                       type="number"
                       min={1}
                       max={totalPages}
                       defaultValue={pageIndex}
                       key={pageIndex}
                       title="Nhập số trang và nhấn Enter"
                       onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                               const val = parseInt(e.currentTarget.value, 10);
                               if (!isNaN(val) && val >= 1 && val <= totalPages && val !== pageIndex) {
                                   setPageIndex(val);
                                   window.scrollTo({ top: 0, behavior: 'smooth' });
                               } else {
                                   e.currentTarget.value = pageIndex.toString();
                               }
                           }
                       }}
                       onBlur={(e) => {
                           const val = parseInt(e.currentTarget.value, 10);
                           if (!isNaN(val) && val >= 1 && val <= totalPages && val !== pageIndex) {
                               setPageIndex(val);
                               window.scrollTo({ top: 0, behavior: 'smooth' });
                           } else {
                               e.currentTarget.value = pageIndex.toString();
                           }
                       }}
                       style={{ 
                           width: '50px', 
                           padding: '0.2rem 0', 
                           textAlign: 'center', 
                           borderRadius: '6px', 
                           border: '1px solid #cbd5e1',
                           fontSize: '1rem',
                           fontWeight: 600,
                           color: '#1e293b',
                           outline: 'none',
                           background: '#fff'
                       }}
                   />
                   / {totalPages}
               </div>
               <button
                   onClick={() => {
                       setPageIndex((p) => Math.min(totalPages, p + 1));
                       window.scrollTo({ top: 0, behavior: 'smooth' });
                   }}
                   disabled={pageIndex === totalPages}
                   style={{ padding: '0.6rem 1.2rem', background: pageIndex === totalPages ? '#cbd5e1' : '#f1f5f9', color: pageIndex === totalPages ? '#64748b' : '#334155', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: pageIndex === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600 }}
               >
                   Trang sau
               </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MentorReviewsPage;
