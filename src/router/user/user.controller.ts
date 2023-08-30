import { Router } from 'express';
import { login, securityKey } from './user.service';
import { isLogin } from '/module/auth';

const router = Router();

/**
 * 유저 로그인
 */
router.post('/login', login);

router.post('/key', isLogin, securityKey);

export = router;
