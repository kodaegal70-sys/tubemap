'use client';

import { useState } from 'react';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // 실제 구현 시 이메일 전송 로직 추가
        console.log('Contact form submitted:', formData);
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'Pretendard, sans-serif' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>문의하기</h1>
            <p style={{ color: '#666', marginBottom: '40px', lineHeight: '1.8' }}>
                TubeMap 서비스에 대한 문의사항, 개선 제안, 맛집 정보 추가 요청 등을 보내주세요.
                최대한 빠르게 답변드리겠습니다.
            </p>

            <form onSubmit={handleSubmit} style={{ marginBottom: '40px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="name" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        이름 *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '16px'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        이메일 *
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '16px'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="subject" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        문의 유형 *
                    </label>
                    <select
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '16px'
                        }}
                    >
                        <option value="">선택해주세요</option>
                        <option value="suggestion">서비스 개선 제안</option>
                        <option value="add-place">맛집 정보 추가 요청</option>
                        <option value="error">오류 신고</option>
                        <option value="copyright">저작권 관련 문의</option>
                        <option value="other">기타 문의</option>
                    </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="message" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        문의 내용 *
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        rows={8}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '16px',
                            resize: 'vertical'
                        }}
                    />
                </div>

                <button
                    type="submit"
                    style={{
                        width: '100%',
                        padding: '16px',
                        background: '#E53935',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    문의하기
                </button>

                {submitted && (
                    <div style={{
                        marginTop: '20px',
                        padding: '16px',
                        background: '#4CAF50',
                        color: 'white',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        문의가 성공적으로 전송되었습니다!
                    </div>
                )}
            </form>

            <section style={{ padding: '30px', background: '#f9f9f9', borderRadius: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>직접 연락</h2>
                <p style={{ lineHeight: '1.8', marginBottom: '12px' }}>
                    <strong>이메일:</strong> kodaegal70@gmail.com
                </p>
                <p style={{ lineHeight: '1.8', color: '#666' }}>
                    평일 09:00 - 18:00 (주말 및 공휴일 제외)
                </p>
            </section>
        </div>
    );
}
