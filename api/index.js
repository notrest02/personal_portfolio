const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();

// 환경 변수 검사 및 오류 처리
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    const errorMessage = `Server configuration error: The following environment variables are missing: ${missingEnvVars.join(', ')}`;
    console.error(errorMessage);
    // 모든 요청에 대해 에러를 반환하는 미들웨어를 등록
    app.use((req, res, next) => {
        res.status(500).json({ 
            error: "Internal Server Error",
            message: errorMessage 
        });
    });
    module.exports = app; // 앱을 내보내서 Vercel이 오류를 렌더링하게 함
} else {
    // 환경 변수가 모두 있을 때만 Supabase 클라이언트 초기화
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            persistSession: false
        }
    });

    // 관리자 API 키 인증 미들웨어
    const authenticateAdmin = (req, res, next) => {
        const apiKey = req.headers['x-admin-api-key'];
        if (!apiKey || apiKey !== ADMIN_API_KEY) {
            return res.status(401).json({ error: 'Unauthorized: Invalid Admin API Key' });
        }
        next();
    };

    // CORS 설정: 모든 도메인에서의 요청을 허용 (개발용)
    app.use(cors());
    // Vercel 로그 확인을 위한 미들웨어
    app.use((req, res, next) => {
      console.log(`[Vercel] Incoming request: ${req.method} ${req.url}`);
      next();
    });
    app.use(express.json()); // JSON 요청 본문 파싱

    // 간단한 테스트 API 엔드포인트
    app.get('/api/', (req, res) => {
        res.send('Hello from the backend!');
    });

    // Supabase에서 프로젝트 데이터를 가져오는 API 엔드포인트 (읽기 - anon key 사용)
    app.get('/api/projects', async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('order', { ascending: true });

            if (error) {
                console.error('Error fetching projects:', error);
                return res.status(500).json({ error: error.message });
            }

            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');

            res.status(200).json(data);
        } catch (err) {
            console.error('Server error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Supabase에 프로젝트 데이터를 추가하는 API 엔드포인트 (쓰기 - service_role key 사용, 인증 필요)
    app.post('/api/projects', authenticateAdmin, async (req, res) => {
        try {
            const { data: maxOrderData, error: maxOrderError } = await supabaseAdmin
                .from('projects')
                .select('order')
                .order('order', { ascending: false })
                .limit(1);

            if (maxOrderError) {
                console.error('Error fetching max order:', maxOrderError);
                return res.status(500).json({ error: maxOrderError.message });
            }

            const newOrder = (maxOrderData && maxOrderData.length > 0) ? maxOrderData[0].order + 1 : 0;

            const projectData = { ...req.body, order: newOrder };

            const { data, error } = await supabaseAdmin
                .from('projects')
                .insert([projectData])
                .select();

            if (error) {
                console.error('Error inserting project:', error);
                return res.status(500).json({ error: error.message });
            }

            res.status(201).json(data);
        } catch (err) {
            console.error('Server error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Supabase에서 프로젝트 데이터를 수정하는 API 엔드포인트
    app.put('/api/projects/:id', authenticateAdmin, async (req, res) => {
        try {
            const { data, error } = await supabaseAdmin
                .from('projects')
                .update(req.body)
                .eq('id', req.params.id)
                .select();

            if (error) {
                console.error('Error updating project:', error);
                return res.status(500).json({ error: error.message });
            }

            res.status(200).json(data);
        } catch (err) {
            console.error('Server error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Supabase에서 프로젝트 데이터를 삭제하는 API 엔드포인트
    app.delete('/api/projects/:id', authenticateAdmin, async (req, res) => {
        try {
            const { error } = await supabaseAdmin
                .from('projects')
                .delete()
                .eq('id', req.params.id);

            if (error) {
                console.error('Error deleting project:', error);
                return res.status(500).json({ error: error.message });
            }

            res.status(204).send();
        } catch (err) {
            console.error('Server error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Supabase에서 프로젝트 순서를 변경하는 API 엔드포인트
    app.post('/api/projects/:id/move', authenticateAdmin, async (req, res) => {
        const { id } = req.params;
        const { direction } = req.body;

        console.log(`[moveProject] Attempting to move project ID: ${id} ${direction}`);

        try {
            const { data: allProjects, error: fetchAllError } = await supabaseAdmin
                .from('projects')
                .select('id, order')
                .order('order', { ascending: true })
                .order('id', { ascending: true });

            if (fetchAllError) {
                console.error('[moveProject] Error fetching all projects:', fetchAllError);
                return res.status(500).json({ error: fetchAllError.message });
            }
            console.log('[moveProject] Fetched all projects:', allProjects);

            const currentIndex = allProjects.findIndex(p => p.id === id);
            if (currentIndex === -1) {
                console.log('[moveProject] Project not found');
                return res.status(404).json({ error: 'Project not found' });
            }

            const currentProject = allProjects[currentIndex];
            let targetProject = null;
            let targetIndex = -1;

            if (direction === 'up') {
                targetIndex = currentIndex - 1;
            } else if (direction === 'down') {
                targetIndex = currentIndex + 1;
            }

            if (targetIndex >= 0 && targetIndex < allProjects.length) {
                targetProject = allProjects[targetIndex];
            }

            console.log('[moveProject] Current project:', currentProject);
            console.log('[moveProject] Target project:', targetProject);

            if (!targetProject) {
                console.log('[moveProject] No project to swap with');
                return res.status(200).json({ message: 'No project to swap with' });
            }

            console.log(`[moveProject] Swapping: ${currentProject.id} (order ${currentProject.order}) with ${targetProject.id} (order ${targetProject.order})`);

            console.log(`[moveProject] Updating current project ${currentProject.id} to order ${targetProject.order}`);
            const { error: updateCurrentError } = await supabaseAdmin
                .from('projects')
                .update({ order: targetProject.order })
                .eq('id', currentProject.id);

            if (updateCurrentError) {
                console.error('[moveProject] Error updating current project order:', updateCurrentError);
                return res.status(500).json({ error: updateCurrentError.message });
            }
            console.log('[moveProject] Current project updated successfully.');

            console.log(`[moveProject] Updating target project ${targetProject.id} to order ${currentProject.order}`);
            const { error: updateTargetError } = await supabaseAdmin
                .from('projects')
                .update({ order: currentProject.order })
                .eq('id', targetProject.id);

            if (updateTargetError) {
                console.error('[moveProject] Error updating target project order:', updateTargetError);
                return res.status(500).json({ error: updateTargetError.message });
            }
            console.log('[moveProject] Target project updated successfully.');

            res.status(200).json({ message: 'Project order updated successfully' });

        } catch (err) {
            console.error('[moveProject] Server error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // 모든 다른 경로에 대한 404 처리 (선택 사항, 디버깅에 도움)
    app.use((req, res) => {
        console.log(`[Vercel] 404 Not Found for: ${req.method} ${req.url}`);
        res.status(404).send('Not Found - Vercel API');
    });
}

module.exports = app;