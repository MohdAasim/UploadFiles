import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const validateRequest = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error } = schema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                details: error.details[0].message,
            });
            return;
        }
        next();
    };
};

export default validateRequest;