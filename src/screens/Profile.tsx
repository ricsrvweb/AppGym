import { useState } from 'react';

import { ScreenHeader } from '@components/ScreenHeader';
import { UserPhoto } from '@components/UserPhoto';
import { Input } from '@components/Input';
import { Button } from '@components/Button';

import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

import defaultUserPhotoImg from '@assets/userPhotoDefault.png';

import { Center, Heading, ScrollView, Skeleton, Text, VStack, useToast } from 'native-base';
import { TouchableOpacity } from 'react-native';
import { useAuht } from '@hooks/useAuth';
import { AppError } from '@utils/AppError';
import { api } from '@services/api';

const PHOTO_SIZE = 33;

type FormDataProps = {
    name: string;
    email: string;
    old_password: string;
    password: string;
    confirm_password: string;
}

const profileSchema = yup.object({
    name: yup.string().required('Informe nome.'),
    email: yup.string(),
    old_password: yup.string(),
    password: yup.string().min(6, 'A senha deve ter pelo menos 6 dígitos.').nullable().transform((value) => (!!value ? value : null)),
    confirm_password: yup
        .string()
        .nullable()
        .transform((value) => (!!value ? value : null))
        .oneOf([yup.ref('password'), null], 'A Confirmação de senha não confere')
        .when('password', {
            is: (Field: any) => Field,
            then: (schema) => schema
                .nullable()
                .required('Informe a confirmação de senha.')
                .transform((value) => (!!value ? value : null))
        })
});

export function Profile() {
    const [isUpdating, setIsUpdating] = useState(false);

    const { user, updateUserProfile } = useAuht();

    const { control, handleSubmit, formState: { errors } } = useForm<FormDataProps>({
        defaultValues: {
            name: user.name,
            email: user.email
        },
        resolver: yupResolver(profileSchema)
    });

    const [photoIsLoading, setPhotoIsLoading] = useState(false);

    const toast = useToast();

    async function handleUpdate(data: FormDataProps) {
        try {
            setIsUpdating(true);

            const userUpdated = user;
            userUpdated.name = data.name;

            await api.put('/users', data);

            await updateUserProfile(userUpdated);

            toast.show({
                title: 'Perfil atualizado com sucesso.',
                placement: 'top',
                bgColor: 'green.500'
            });
        } catch (error) {
            const isAppError = error instanceof AppError;
            const title = isAppError ? error.message : 'Não foi possível atualizar os dados do Perfil. Tente novamente mais tarde.';

            toast.show({
                title,
                placement: 'top',
                bgColor: 'red.500'
            });
        } finally {
            setIsUpdating(false);
        }
    }

    async function handleuserPhotoSelect() {
        setPhotoIsLoading(true);

        try {
            const photoSelected = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1,
                aspect: [4, 4],
                allowsEditing: true,
            });

            if (photoSelected.canceled) {
                return;
            }

            if (photoSelected.assets[0].uri) {
                const photoInfo = await FileSystem.getInfoAsync(photoSelected.assets[0].uri);

                //if(photoInfo.size && (photoInfo.size / 1024 / 1024) > 3){
                if (photoSelected.assets[0].fileSize && (photoSelected.assets[0].fileSize / 1024 / 1024) > 5) {
                    return toast.show({
                        title: 'Essa imagem é muito grande. Escolha uma de até 5MB.',
                        placement: 'top',
                        bgColor: 'red.500'
                    })
                }

                const fileExtension = photoSelected.assets[0].uri.split('.').pop();

                const photoFile = {
                    name: `${user.name}.${fileExtension}`.toLowerCase(),
                    uri: photoSelected.assets[0].uri,
                    type: `${photoSelected.assets[0].type}`
                } as any;

                const userPhotoUploadForm = new FormData();
                userPhotoUploadForm.append('avatar', photoFile);

                const avatarUpdatedResponse = await api.patch('/users/avatar', userPhotoUploadForm, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                const userUpdated = user;
                userUpdated.avatar = avatarUpdatedResponse.data.avatar;
                updateUserProfile(userUpdated);

                console.log(userUpdated);

                toast.show({
                    title: 'Foto atualizada com sucesso!',
                    placement: 'top',
                    bgColor: 'green.500'
                })
            }
        } catch (error) {
            console.log(error);
        } finally {
            setPhotoIsLoading(false);
        }
    }

    return (
        <VStack flex={1}>
            <ScreenHeader title="Perfil" />

            <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
                <Center mt={6} px={10}>
                    {
                        photoIsLoading ?
                            <Skeleton
                                w={PHOTO_SIZE}
                                h={PHOTO_SIZE}
                                rounded="full"
                                startColor="gray.500"
                                endColor="gray.400"
                            />
                            :
                            <UserPhoto
                                source={user.avatar ? { uri: `${api.defaults.baseURL}/avatar/${user.avatar}` } : defaultUserPhotoImg}
                                alt="Foto do Usuario"
                                size={PHOTO_SIZE}
                            />
                    }
                    <TouchableOpacity onPress={handleuserPhotoSelect}>
                        <Text color="green.500" fontWeight="bold" fontSize="md" mt={2} mb={8}>
                            Alterar foto
                        </Text>
                    </TouchableOpacity>

                    <Controller
                        control={control}
                        name="name"
                        render={({ field: { onChange, value } }) => (
                            <Input
                                bg="gray.600"
                                placeholder="Nome"
                                onChangeText={onChange}
                                value={value}
                                errorMessage={errors.name?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, value } }) => (
                            <Input
                                bg="gray.600"
                                placeholder="E-mail"
                                isDisabled
                                value={value}
                            />
                        )}
                    />

                    <Heading color="gray.200" fontSize="md" mb={2} alignSelf="flex-start" mt={12} fontFamily="heading">
                        Alterar senha
                    </Heading>

                    <Controller
                        control={control}
                        name="old_password"
                        render={({ field: { onChange } }) => (
                            <Input
                                bg="gray.600"
                                placeholder="Senha Antiga"
                                secureTextEntry
                                onChangeText={onChange}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange } }) => (
                            <Input
                                bg="gray.600"
                                placeholder="Nova senha"
                                secureTextEntry
                                onChangeText={onChange}
                                errorMessage={errors.password?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="confirm_password"
                        render={({ field: { onChange } }) => (
                            <Input
                                bg="gray.600"
                                placeholder="Confirme a nova senha"
                                secureTextEntry
                                onChangeText={onChange}
                                onSubmitEditing={handleSubmit(handleUpdate)}
                                returnKeyType='send'
                                errorMessage={errors.confirm_password?.message}
                            />
                        )}
                    />

                    <Button
                        title='Atualizar'
                        onPress={handleSubmit(handleUpdate)}
                        isLoading={isUpdating}
                    />
                </Center>
            </ScrollView>
        </VStack>
    );
}