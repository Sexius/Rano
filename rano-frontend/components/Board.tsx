
import React, { useState, useEffect } from 'react';
import { MessageSquare, PenSquare, ChevronLeft, User, Eye, ThumbsUp, Trash2 } from 'lucide-react';
import { Post, User as UserType, Comment } from '../types';

interface BoardProps {
  user: UserType | null;
  onOpenAuth: () => void;
}

const DEFAULT_POSTS: Post[] = [
  { id: 101, title: '[공지] 카프라 마켓 서비스 오픈 안내', author: '운영자', content: '안녕하세요, 카프라 마켓입니다. \n보다 편리한 아이템 거래를 위해 새로운 검색 서비스를 오픈했습니다.\n많은 이용 부탁드립니다.', date: '2024.03.15', views: 1542, likes: 120, comments: [], isNotice: true },
  { id: 100, title: '[이벤트] 오픈 기념 경험치 50% 증가 이벤트', author: '운영자', content: '주말 간 경험치 이벤트가 진행됩니다.', date: '2024.03.14', views: 890, likes: 55, comments: [], isNotice: true },
  { id: 4, title: '바포메트 서버 시세 질문드립니다', author: '초보모험가', content: '+9 시공망토 요즘 얼마정도 하나요? 복귀 유저라 시세를 잘 모르겠네요.', date: '14:20', views: 42, likes: 2, comments: [{id: 1, author: '상인', content: '대략 1.5억 정도 합니다.', date: '14:25'}] },
  { id: 3, title: '다이크 서버 길드원 모집합니다 (매너 길드)', author: '길드마스터', content: '친목 위주 매너 길드입니다. 레벨 제한 없습니다. 귓 주세요.', date: '13:05', views: 12, likes: 5, comments: [] },
  { id: 2, title: '득템 인증합니다 ㅋㅋ', author: '럭키가이', content: '지나가다 잡은 포링이 카드를 줬네요;;', date: '11:40', views: 256, likes: 44, comments: [] },
  { id: 1, title: '검사 스킬 트리 추천좀요', author: '나이트지망생', content: '양손검 기사 가려고 하는데 스킬 어떻게 찍어야 하나요?', date: '10:15', views: 88, likes: 0, comments: [] },
];

const Board: React.FC<BoardProps> = ({ user, onOpenAuth }) => {
  const [view, setView] = useState<'list' | 'detail' | 'write'>('list');
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  // Write Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Comment Form State
  const [commentInput, setCommentInput] = useState('');

  // Load Posts from LocalStorage
  useEffect(() => {
    const savedPosts = localStorage.getItem('kafra_posts');
    if (savedPosts) {
      setPosts(JSON.parse(savedPosts));
    } else {
      setPosts(DEFAULT_POSTS);
    }
  }, []);

  // Save Posts to LocalStorage whenever they change
  useEffect(() => {
    if (posts.length > 0) {
      localStorage.setItem('kafra_posts', JSON.stringify(posts));
    }
  }, [posts]);

  const updatePost = (updatedPost: Post) => {
    const newPosts = posts.map(p => p.id === updatedPost.id ? updatedPost : p);
    setPosts(newPosts);
    setSelectedPost(updatedPost); // Keep UI updated
  };

  const handlePostClick = (post: Post) => {
    const updatedPost = { ...post, views: post.views + 1 };
    updatePost(updatedPost);
    setView('detail');
  };

  const handleLike = () => {
    if (!selectedPost) return;
    if (!user) {
      if (confirm('로그인이 필요합니다. 로그인 하시겠습니까?')) onOpenAuth();
      return;
    }
    const updatedPost = { ...selectedPost, likes: selectedPost.likes + 1 };
    updatePost(updatedPost);
  };

  const handleAddComment = () => {
    if (!selectedPost) return;
    if (!user) {
      if (confirm('로그인이 필요합니다. 로그인 하시겠습니까?')) onOpenAuth();
      return;
    }
    if (!commentInput.trim()) return;

    const newComment: Comment = {
      id: Date.now(),
      author: user.nickname,
      content: commentInput,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMine: true
    };

    const updatedPost = {
      ...selectedPost,
      comments: [...(selectedPost.comments || []), newComment]
    };

    updatePost(updatedPost);
    setCommentInput('');
  };

  const handleDeleteComment = (commentId: number) => {
    if (!selectedPost) return;
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    
    const updatedPost = {
      ...selectedPost,
      comments: selectedPost.comments.filter(c => c.id !== commentId)
    };
    updatePost(updatedPost);
  };

  const handleWriteClick = () => {
    if (!user) {
      if (confirm('로그인이 필요한 서비스입니다.\n로그인 하시겠습니까?')) {
        onOpenAuth();
      }
      return;
    }
    setTitle('');
    setContent('');
    setView('write');
  };

  const handleSavePost = () => {
    if (!title.trim() || !content.trim()) return alert('제목과 내용을 입력해주세요.');
    
    const notices = posts.filter(p => p.isNotice);
    const regularPosts = posts.filter(p => !p.isNotice);
    const maxId = regularPosts.length > 0 ? Math.max(...regularPosts.map(p => p.id)) : 0;
    
    const newPost: Post = {
      id: maxId + 1,
      title,
      content,
      author: user?.nickname || '익명',
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      views: 0,
      likes: 0,
      comments: [],
      isNotice: false
    };

    setPosts([...notices, newPost, ...regularPosts]);
    setView('list');
  };

  // --- Views ---

  const ListView = () => (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
           <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
             자유 게시판 <span className="text-sm font-normal text-gray-500">Free Board</span>
           </h2>
           <p className="text-sm text-gray-500 mt-1">유저들과 자유롭게 정보를 공유하세요.</p>
        </div>
        <button 
          onClick={handleWriteClick}
          className="flex items-center justify-center gap-2 bg-kafra-600 hover:bg-kafra-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <PenSquare size={18} /> 글쓰기
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="hidden md:flex bg-gray-50 border-b border-gray-200 px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <div className="w-16 text-center">번호</div>
          <div className="flex-1">제목</div>
          <div className="w-32 text-center">작성자</div>
          <div className="w-24 text-center">작성일</div>
          <div className="w-20 text-center">추천</div>
          <div className="w-20 text-center">조회</div>
        </div>

        <div className="divide-y divide-gray-100">
          {posts.map((post) => (
            <div 
              key={post.id} 
              onClick={() => handlePostClick(post)}
              className={`
                group flex flex-col md:flex-row md:items-center px-6 py-4 md:py-3 cursor-pointer transition-colors
                ${post.isNotice ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-gray-50'}
              `}
            >
              <div className="hidden md:block w-16 text-center text-sm font-medium text-gray-400">
                {post.isNotice ? <span className="text-kafra-600 font-bold">공지</span> : post.id}
              </div>

              <div className="flex-1 mb-2 md:mb-0 pr-4">
                 <div className="flex items-center gap-2">
                    {post.isNotice && <span className="md:hidden text-xs font-bold text-kafra-600 bg-kafra-100 px-1.5 py-0.5 rounded">공지</span>}
                    <span className="text-sm md:text-base font-medium text-gray-900 group-hover:text-kafra-600 transition-colors line-clamp-1">
                      {post.title}
                    </span>
                    {post.comments && post.comments.length > 0 && (
                      <span className="text-xs font-bold text-kafra-600 bg-kafra-50 px-1.5 rounded-md border border-kafra-100">
                        {post.comments.length}
                      </span>
                    )}
                    {post.likes > 10 && <span className="text-[10px] font-bold text-red-500 border border-red-200 px-1 rounded">HOT</span>}
                 </div>
              </div>

              <div className="flex md:hidden items-center text-xs text-gray-400 gap-3">
                 <span className="font-medium text-gray-600">{post.author}</span>
                 <span>{post.date}</span>
                 <span className="flex items-center gap-1"><ThumbsUp size={10}/> {post.likes}</span>
                 <span className="flex items-center gap-1"><Eye size={10}/> {post.views}</span>
              </div>

              <div className="hidden md:block w-32 text-center text-sm text-gray-600 truncate px-2">{post.author}</div>
              <div className="hidden md:block w-24 text-center text-sm text-gray-400 font-mono">{post.date}</div>
              <div className="hidden md:block w-20 text-center text-sm text-gray-400">{post.likes}</div>
              <div className="hidden md:block w-20 text-center text-sm text-gray-400">{post.views}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const DetailView = () => {
    if (!selectedPost) return null;
    return (
      <div className="animate-fade-in max-w-4xl mx-auto">
        <button 
          onClick={() => setView('list')}
          className="flex items-center text-gray-500 hover:text-gray-900 mb-4 transition-colors text-sm font-medium"
        >
          <ChevronLeft size={16} className="mr-1" /> 목록으로 돌아가기
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 md:p-8">
          <div className="border-b border-gray-100 pb-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
               {selectedPost.isNotice && <span className="bg-kafra-100 text-kafra-600 text-xs font-bold px-2 py-1 rounded-md">공지</span>}
               <span className="text-gray-400 text-sm">{selectedPost.date}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">{selectedPost.title}</h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <User size={20} />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{selectedPost.author}</div>
                  <div className="text-xs text-gray-500">모험가 레벨 99</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                 <span className="flex items-center gap-1.5"><Eye size={16}/> {selectedPost.views}</span>
                 <span className="flex items-center gap-1.5"><MessageSquare size={16}/> {selectedPost.comments?.length || 0}</span>
              </div>
            </div>
          </div>

          <div className="min-h-[200px] text-gray-800 leading-relaxed whitespace-pre-line mb-8">
            {selectedPost.content}
          </div>
          
          <div className="flex justify-center mb-8">
             <button 
               onClick={handleLike}
               className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-600 hover:text-red-500 transition-all font-bold group"
             >
                <ThumbsUp size={20} className={`group-hover:scale-110 transition-transform ${selectedPost.likes > 0 ? 'fill-current' : ''}`}/>
                <span>추천 {selectedPost.likes}</span>
             </button>
          </div>

          {/* Comment Section */}
          <div className="bg-gray-50 rounded-xl p-6">
             <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                댓글 <span className="text-kafra-600">{selectedPost.comments?.length || 0}</span>
             </h3>
             
             {/* Comment Input */}
             <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder={user ? "댓글을 입력하세요..." : "로그인이 필요한 서비스입니다."} 
                  disabled={!user}
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-kafra-500 text-sm disabled:bg-gray-100"
                />
                <button 
                  onClick={handleAddComment}
                  disabled={!user}
                  className="bg-gray-900 text-white font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-black transition-colors disabled:opacity-50"
                >
                  등록
                </button>
             </div>

             {/* Comment List */}
             <div className="space-y-4">
               {selectedPost.comments && selectedPost.comments.length > 0 ? (
                 selectedPost.comments.map(comment => (
                   <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                         <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900">{comment.author}</span>
                            {comment.author === selectedPost.author && <span className="text-[10px] text-kafra-600 border border-kafra-200 px-1 rounded">작성자</span>}
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="text-xs text-gray-400">{comment.date}</span>
                           {(comment.isMine || user?.nickname === comment.author) && (
                              <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-300 hover:text-red-500">
                                <Trash2 size={12}/>
                              </button>
                           )}
                         </div>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-8 text-gray-400 text-sm">
                   등록된 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    );
  };

  const WriteView = () => (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">글쓰기</h2>
        <button 
          onClick={() => setView('list')}
          className="text-gray-500 hover:text-gray-900 text-sm font-medium"
        >
          취소
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-6">
        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">제목</label>
           <input 
             type="text" 
             value={title}
             onChange={(e) => setTitle(e.target.value)}
             className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-kafra-500 focus:ring-4 focus:ring-kafra-50/50 transition-all text-gray-900 placeholder-gray-400 font-medium"
             placeholder="제목을 입력하세요"
           />
        </div>
        
        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">내용</label>
           <textarea 
             value={content}
             onChange={(e) => setContent(e.target.value)}
             className="w-full h-80 border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-kafra-500 focus:ring-4 focus:ring-kafra-50/50 transition-all text-gray-900 placeholder-gray-400 font-medium resize-none"
             placeholder="내용을 입력하세요. (부적절한 홍보 및 욕설 게시 시 제재될 수 있습니다.)"
           />
        </div>

        <div className="flex justify-end gap-3 pt-2">
           <button 
             onClick={() => setView('list')}
             className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
           >
             취소
           </button>
           <button 
             onClick={handleSavePost}
             className="px-8 py-3 rounded-xl bg-kafra-600 text-white font-bold hover:bg-kafra-700 shadow-lg shadow-kafra-500/30 transition-all active:scale-95"
           >
             등록하기
           </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto w-full">
      {view === 'list' && <ListView />}
      {view === 'detail' && <DetailView />}
      {view === 'write' && <WriteView />}
    </div>
  );
};

export default Board;