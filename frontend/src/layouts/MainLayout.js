import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Collapse,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import AddBoxIcon from '@mui/icons-material/AddBox';
import InventoryIcon from '@mui/icons-material/Inventory';
import ComputerIcon from '@mui/icons-material/Computer';
import AppsIcon from '@mui/icons-material/Apps';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SettingsIcon from '@mui/icons-material/Settings';
import CategoryIcon from '@mui/icons-material/Category';
import GroupsIcon from '@mui/icons-material/Groups';
import HistoryIcon from '@mui/icons-material/History';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuthStore } from '../store/authStore';

const drawerWidth = 260;

const menuSections = [
  {
    id: 'inicio',
    label: 'Início',
    icon: <DashboardIcon fontSize="small" />,
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
      { text: 'Meus Chamados', icon: <AssignmentIndIcon />, path: '/home/meus-chamados' },
    ],
  },
  {
    id: 'chamados',
    label: 'Chamados',
    icon: <ConfirmationNumberIcon fontSize="small" />,
    items: [
      { text: 'Todos os Chamados', icon: <FormatListBulletedIcon />, path: '/ocorrencias' },
      { text: 'Abrir Chamado', icon: <AddBoxIcon />, path: '/ocorrencias/abrir' },
    ],
  },
  {
    id: 'inventario',
    label: 'Inventário',
    icon: <InventoryIcon fontSize="small" />,
    items: [
      { text: 'Ativos', icon: <ComputerIcon />, path: '/inventario' },
      { text: 'Catálogo de Software', icon: <AppsIcon />, path: '/inventario/software' },
      { text: 'Licenças', icon: <VpnKeyIcon />, path: '/inventario/licencas' },
    ],
  },
  {
    id: 'clientes',
    label: 'Clientes',
    icon: <BusinessIcon fontSize="small" />,
    items: [
      { text: 'Gerenciar Clientes', icon: <PeopleIcon />, path: '/clientes' },
    ],
  },
  {
    id: 'admin',
    label: 'Administração',
    icon: <AdminPanelSettingsIcon fontSize="small" />,
    items: [
      { text: 'Configurações', icon: <SettingsIcon />, path: '/admin/configuracoes' },
      { text: 'Áreas de Atendimento', icon: <CategoryIcon />, path: '/admin/areas' },
      { text: 'Grupos Técnicos', icon: <GroupsIcon />, path: '/admin/grupos-tecnicos' },
      { text: 'Logs do Sistema', icon: <HistoryIcon />, path: '/admin/logs' },
    ],
  },
];

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openSections, setOpenSections] = useState(() => {
    const initial = {};
    menuSections.forEach((s) => { initial[s.id] = true; });
    return initial;
  });

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleMenuClick = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const toggleSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ overflow: 'auto' }}>
      <Toolbar sx={{ px: 2 }}>
        <Typography variant="h6" noWrap fontWeight={700} color="primary">
          Chamados TI
        </Typography>
      </Toolbar>
      <Divider />
      <List disablePadding>
        {menuSections.map((section) => (
          <React.Fragment key={section.id}>
            {/* Section header */}
            <ListItemButton
              onClick={() => toggleSection(section.id)}
              sx={{
                py: 0.75,
                px: 2,
                bgcolor: 'grey.50',
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: 'primary.main' }}>
                {section.icon}
              </ListItemIcon>
              <ListItemText
                primary={section.label}
                primaryTypographyProps={{
                  variant: 'caption',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  color: 'text.secondary',
                }}
              />
              {openSections[section.id] ? (
                <ExpandLessIcon fontSize="small" sx={{ color: 'text.disabled' }} />
              ) : (
                <ExpandMoreIcon fontSize="small" sx={{ color: 'text.disabled' }} />
              )}
            </ListItemButton>

            {/* Section items */}
            <Collapse in={openSections[section.id]} timeout="auto" unmountOnExit>
              <List disablePadding>
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <ListItem key={item.path} disablePadding>
                      <ListItemButton
                        onClick={() => handleMenuClick(item.path)}
                        selected={active}
                        sx={{
                          pl: 4,
                          py: 0.75,
                          borderLeft: active ? '3px solid' : '3px solid transparent',
                          borderColor: active ? 'primary.main' : 'transparent',
                          '&.Mui-selected': {
                            bgcolor: 'primary.50',
                            '& .MuiListItemIcon-root': { color: 'primary.main' },
                            '& .MuiListItemText-primary': { fontWeight: 600, color: 'primary.main' },
                          },
                          '&.Mui-selected:hover': { bgcolor: 'primary.100' },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 36,
                            color: active ? 'primary.main' : 'text.secondary',
                            '& .MuiSvgIcon-root': { fontSize: 20 },
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Sistema de Gestão de Chamados e Inventário
          </Typography>
          <IconButton onClick={handleProfileMenuOpen} color="inherit">
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              {user?.nome?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">{user?.nome}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Sair
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default MainLayout;
