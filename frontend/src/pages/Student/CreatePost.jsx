import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPost, getCategories, getManagedPost, updatePost } from "../../api/postApi";
import { readFileAsDataUrl, resolveMediaUrl } from "../../utils/media";

function CreatePost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    categoryId: "",
    summary: "",
  });
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        setLoading(true);
        setError("");
        const [categoriesResponse, postResponse] = await Promise.all([
          getCategories(),
          editId ? getManagedPost(editId) : Promise.resolve(null),
        ]);

        if (!isMounted) {
          return;
        }

        const loadedCategories = categoriesResponse.data;
        setCategories(loadedCategories);

        if (postResponse) {
          setFormData({
            title: postResponse.data.title || "",
            categoryId: postResponse.data.categoryId || loadedCategories[0]?.id || "",
            summary: postResponse.data.summary || postResponse.data.content || "",
          });
          setExistingImageUrl(postResponse.data.imageUrl || "");
        } else {
          setFormData((current) => ({
            ...current,
            categoryId: current.categoryId || loadedCategories[0]?.id || "",
          }));
          setExistingImageUrl("");
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || "Không tải được dữ liệu bài viết.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [editId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn đúng file ảnh.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh tối đa 5MB.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setSelectedImage({
        name: file.name,
        dataUrl,
      });
      setRemoveImage(false);
      setError("");
    } catch {
      setError("Không đọc được file ảnh.");
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setRemoveImage(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.title.trim() || !formData.summary.trim() || !formData.categoryId) {
      setError("Bạn cần nhập tiêu đề, mô tả và chủ đề.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        categoryId: formData.categoryId,
        summary: formData.summary.trim(),
        removeImage,
      };

      if (selectedImage) {
        payload.imageBase64 = selectedImage.dataUrl;
        payload.imageName = selectedImage.name;
      }

      const response = editId ? await updatePost(editId, payload) : await createPost(payload);
      setSuccess(response.data.message || "Đã lưu bài viết.");

      if (!editId) {
        setFormData({
          title: "",
          categoryId: categories[0]?.id || "",
          summary: "",
        });
        setSelectedImage(null);
        setExistingImageUrl("");
        setRemoveImage(false);
      }

      setTimeout(() => {
        navigate("/profile");
      }, 1000);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể lưu bài viết.");
    } finally {
      setSubmitting(false);
    }
  };

  const previewCategory = categories.find((item) => item.id === formData.categoryId)?.name || "Chưa chọn chủ đề";
  const previewImage = selectedImage?.dataUrl || (!removeImage ? resolveMediaUrl(existingImageUrl) : "");

  return (
    <section className="page-stack">
      <div className="hero-panel hero-panel--compact">
        <div className="hero-panel__content">
          <p className="eyebrow">{editId ? "Chỉnh sửa bài viết" : "Soạn bài viết"}</p>
          <h2>
            {editId
              ? "Cập nhật tiêu đề, mô tả ngắn và ảnh minh họa để hệ thống kiểm tra lại mức độ an toàn."
              : "Bài viết an toàn sẽ được đăng ngay, chỉ nội dung rủi ro mới chuyển qua admin kiểm duyệt."}
          </h2>
          <p>
            Form đăng bài giờ chỉ giữ 3 phần cốt lõi: tiêu đề, mô tả ngắn và 1 ảnh minh họa. Nếu nội dung có dấu hiệu
            xúc phạm, phân biệt, tình dục, bạo lực hoặc máu me, bài sẽ vào hàng chờ duyệt.
          </p>
        </div>
      </div>

      {error ? <div className="form-error">{error}</div> : null}
      {success ? <div className="form-success">{success}</div> : null}

      <div className="content-grid">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          {loading ? <div className="empty-state">Đang tải dữ liệu form...</div> : null}

          {!loading ? (
            <>
              <div className="field">
                <label htmlFor="title">Tiêu đề bài viết</label>
                <input
                  id="title"
                  name="title"
                  className="text-input"
                  type="text"
                  placeholder="Ví dụ: Kinh nghiệm tách task frontend backend cho đồ án môn học"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label htmlFor="categoryId">Chủ đề</label>
                <select
                  id="categoryId"
                  name="categoryId"
                  className="select-input"
                  value={formData.categoryId}
                  onChange={handleChange}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="summary">Mô tả ngắn</label>
                <textarea
                  id="summary"
                  name="summary"
                  className="text-area short"
                  placeholder="Viết phần mô tả chính của bài viết. Đây sẽ là nội dung người đọc nhìn thấy."
                  value={formData.summary}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label htmlFor="imageFile">Ảnh minh họa</label>
                <input id="imageFile" className="text-input" type="file" accept="image/*" onChange={handleImageChange} />
                <span className="section-heading__note">Tối đa 1 ảnh, dung lượng 5MB.</span>
              </div>

              {(selectedImage || existingImageUrl) && !removeImage ? (
                <div className="upload-preview">
                  <img src={previewImage} alt="Xem trước ảnh bài viết" className="upload-preview__image" />
                  <div className="action-row">
                    <button type="button" className="ghost-button compact danger" onClick={handleRemoveImage}>
                      Gỡ ảnh
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="action-row">
                <button type="button" className="outline-button" onClick={() => navigate("/profile")}>
                  Quay lại hồ sơ
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Đang gửi..." : editId ? "Cập nhật bài viết" : "Đăng bài viết"}
                </button>
              </div>
            </>
          ) : null}
        </form>

        <aside className="aside-stack">
          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Cách kiểm duyệt mới</p>
                <h3>Đăng ngay nếu nội dung an toàn</h3>
              </div>
            </div>
            <ul className="clean-list">
              <li>Bài sạch sẽ được hiển thị ngay trên bảng tin.</li>
              <li>Bài có dấu hiệu xúc phạm, kỳ thị, tình dục, bạo lực hoặc máu me sẽ vào hàng chờ duyệt.</li>
              <li>Ảnh được upload trực tiếp từ máy tính thay vì nhập URL thủ công.</li>
            </ul>
          </div>

          <div className="panel preview-card">
            <p className="eyebrow">Xem trước</p>
            <h3>{formData.title || "Tiêu đề bài viết sẽ hiện ở đây"}</h3>
            <p>{formData.summary || "Mô tả ngắn sẽ xuất hiện ở đây để người đọc nắm nhanh nội dung bài viết."}</p>
            <div className="post-card__visual">
              <div className="post-card__visual-badge">{previewCategory}</div>
              {previewImage ? (
                <img src={previewImage} alt="Ảnh xem trước" className="upload-preview__image" />
              ) : (
                <>
                  <strong>Chưa thêm ảnh minh họa</strong>
                  <p>Bài viết vẫn có thể đăng chỉ với tiêu đề và mô tả ngắn.</p>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CreatePost;
